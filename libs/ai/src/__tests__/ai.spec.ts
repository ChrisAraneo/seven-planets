// @vitest-environment node
// The mastermind brain reads the game state from the store like any player,
// So it can be tested headless; full games run with AUTO_HUMAN (no `document`).
// Importing the store creates it and installs the state accessor. No
// Presentation layer is installed, so the engine's hooks are no-ops.
import '@/stores';

import { describe, expect, it } from 'vitest';

import { battleWinProb } from '../functions/battle-win-prob';
import { bestAttackNow } from '../functions/best-attack-now';
import { buildCandidates } from '../functions/build-candidates';
import { evaluateAttacks } from '../functions/evaluate-attacks';
import { holdProbability } from '../functions/hold-probability';
import { mastermindDraftPick } from '../functions/mastermind-draft-pick';
import { minTroopsToConquer } from '../functions/min-troops-to-conquer';
import { planFor } from '../functions/plan-for';
import { resetAiWeights } from '../functions/reset-ai-weights';
import { survivorsAfterWin } from '../functions/survivors-after-win';
import { COMBAT } from '@seven-planets/game';
import { simulateGameWithPersonalities } from '@seven-planets/game';
import type { GameState } from '@seven-planets/game';
import { getGameState, resetGameState } from '@seven-planets/game';

/** A deterministic mid-game state: player 0 is the mastermind. Installed into
    the store's game module, which is where the AI functions read it from. */
function midGameState(): GameState {
  resetGameState({ raw: true }); // Headless — skip reactivity
  const s = getGameState();
  s.turn = 20;
  for (const p of getGameState().players) {
    p.personality = 'mastermind';
  }
  return s;
}

describe('mastermind combat analytics', () => {
  it('computes exact battle win probabilities', () => {
    expect(battleWinProb(100, 10)).toBe(1); // Overwhelming force
    expect(battleWinProb(0, 100)).toBe(0); // Hopeless
    // Equal bases: attacker needs a strictly higher roll — with two uniform
    // Rolls of 0..R the exact probability is R(R+1)/2 / (R+1)^2.
    const R = COMBAT.attackRoll;
    const exact = (R * (R + 1)) / 2 / ((R + 1) * (COMBAT.defenseRoll + 1));
    expect(battleWinProb(10, 10)).toBeCloseTo(exact, 10);
    // Monotonic in attacker strength.
    expect(battleWinProb(12, 10)).toBeGreaterThan(battleWinProb(10, 10));
  });

  it('derives the minimum conquering force from the casualty fractions', () => {
    // Brute-force cross-check against the engine's formula:
    // A winning strike of n kills ceil(n·num/den) defenders.
    const { num, den } = COMBAT.winDefLoss;
    for (let troops = 1; troops <= 12; troops++) {
      let n = 1;
      while (Math.ceil((n * num) / den) < troops) {
        n++;
      }
      expect(minTroopsToConquer(troops)).toBe(n);
    }
  });

  it('counts survivors after a winning strike', () => {
    const { num, den } = COMBAT.winAttLoss;
    for (const n of [2, 5, 6, 9, 17]) {
      expect(survivorsAfterWin(n)).toBe(n - Math.floor((n * num) / den));
    }
  });
});

describe('mastermind retention forecast (holdProbability)', () => {
  it('stays within [0,1] and drops when a rival grows stronger', () => {
    resetAiWeights();
    const s = midGameState();
    const me = getGameState().players[0];
    const mine = getGameState().planets[0];
    // No rival has a silo yet — nobody can attack, we surely hold.
    expect(holdProbability(me, mine, 5)).toBe(1);
    // Arm a rival heavily: retention must drop, but stay a probability.
    getGameState().planets[1].buildings.SILO = 2;
    getGameState().planets[1].buildings.BARRACKS = 2;
    getGameState().planets[1].troops = 20;
    getGameState().players[1].hand.ATTACK = 2;
    const threatened = holdProbability(me, mine, 5);
    expect(threatened).toBeLessThan(1);
    expect(threatened).toBeGreaterThanOrEqual(0);
    // A bigger garrison holds better (or at least no worse).
    expect(holdProbability(me, mine, 15)).toBeGreaterThanOrEqual(threatened);
  });
});

describe('mastermind attack planning', () => {
  it('finds a high-confidence conquest and prices its retention', () => {
    resetAiWeights();
    const s = midGameState();
    const me = getGameState().players[0];
    getGameState().planets[0].buildings.SILO = 2; // Cap 12
    getGameState().planets[0].troops = 14;
    getGameState().planets[1].troops = 2; // Soft target
    me.hand.ATTACK = 1;
    const plans = evaluateAttacks(me);
    expect(plans.length).toBeGreaterThan(0);
    const best = plans[0];
    expect(best.conquers).toBe(true);
    expect(best.pWin).toBeGreaterThan(0.6);
    expect(best.n).toBeGreaterThanOrEqual(
      minTroopsToConquer(getGameState().planets[1].troops),
    );
    expect(best.holdProb).toBeGreaterThanOrEqual(0);
    expect(best.holdProb).toBeLessThanOrEqual(1);
    const now = bestAttackNow(me);
    expect(now).not.toBeNull();
    // Never commits more troops than the source can spare or the rocket holds.
    expect(now!.n).toBeLessThanOrEqual(getGameState().planets[0].troops);
  });

  it('never plans an attack for a pacifist', () => {
    const s = midGameState();
    const me = getGameState().players[0];
    me.pacifistStatus = true;
    getGameState().planets[0].buildings.SILO = 3;
    getGameState().planets[0].troops = 30;
    me.hand.ATTACK = 3;
    expect(evaluateAttacks(me)).toHaveLength(0);
    expect(bestAttackNow(me)).toBeNull();
  });
});

describe('mastermind build planning and strategy', () => {
  it('proposes worthwhile builds and forms a plan', () => {
    resetAiWeights();
    const s = midGameState();
    const me = getGameState().players[0];
    me.hand.ORE = 3;
    me.hand.CRYSTAL = 3;
    me.hand.ENERGY = 3;
    const cands = buildCandidates(me);
    expect(cands.length).toBeGreaterThan(0);
    for (const c of cands) {
      expect(c.worth).toBeGreaterThan(0);
      expect(c.pComplete).toBeGreaterThan(0);
      expect(c.pComplete).toBeLessThanOrEqual(1);
    }
    const plan = planFor(me);
    expect(plan.buildQueue.length).toBeGreaterThan(0);
    expect(plan.scores[plan.kind]).toBeGreaterThan(0);
    // The plan is cached for the turn (draft picks reuse one plan).
    expect(planFor(me)).toBe(plan);
  });
});

describe('mastermind drafting', () => {
  it('picks a valid pool index and respects pickability', () => {
    resetAiWeights();
    const s = midGameState();
    const me = getGameState().players[0];
    s.pool = ['ORE', 'CRYSTAL', 'ENERGY', 'ATTACK', 'RELIC'];
    const all = getGameState().pool.map(() => true);
    const idx = mastermindDraftPick(me, getGameState().planets[0], all);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(getGameState().pool.length);
    // Nothing pickable → pass.
    expect(
      mastermindDraftPick(
        me,
        getGameState().planets[0],
        getGameState().pool.map(() => false),
      ),
    ).toBe(-1);
    // Only slot 2 pickable → must take slot 2.
    const onlyTwo = getGameState().pool.map((_, i) => i === 2);
    expect(mastermindDraftPick(me, getGameState().planets[0], onlyTwo)).toBe(2);
  });
});

describe('kamikaze (Hard mode) targeting', () => {
  it('a kamikaze only ever plans attacks against the human — never another AI', () => {
    resetAiWeights();
    const s = midGameState();
    const kami = getGameState().players[1];
    kami.kamikaze = true;
    // Arm the kamikaze with a real strike force.
    getGameState().planets[1].buildings.SILO = 2;
    getGameState().planets[1].troops = 16;
    kami.hand.ATTACK = 1;
    getGameState().planets[0].troops = 2; // Human — the ONLY legal target
    getGameState().planets[2].troops = 2; // Rival AI — juicy but forbidden
    const plans = evaluateAttacks(kami);
    expect(plans.length).toBeGreaterThan(0);
    expect(
      plans.every((p) => getGameState().planets[p.target.id].ownerId === 0),
    ).toBe(true);
    const now = bestAttackNow(kami);
    expect(now).not.toBeNull();
    expect(getGameState().planets[now!.target.id].ownerId).toBe(0); // Struck the human
  });

  it('a normal AI ignores kamikazes — never plans an attack against one', () => {
    resetAiWeights();
    const s = midGameState();
    getGameState().players[1].kamikaze = true;
    // A normal AI (id 2) with a strike force.
    const normal = getGameState().players[2];
    getGameState().planets[2].buildings.SILO = 2;
    getGameState().planets[2].troops = 16;
    normal.hand.ATTACK = 1;
    // Make the kamikaze's planet the softest target in the galaxy.
    getGameState().planets[1].troops = 1;
    getGameState().planets[0].troops = 8; // Human, better defended
    getGameState().planets[3].troops = 8; // Another rival
    const plans = evaluateAttacks(normal);
    // It may attack the human or other rivals, but NEVER the kamikaze (id 1).
    expect(
      plans.every((p) => getGameState().planets[p.target.id].ownerId !== 1),
    ).toBe(true);
  });

  it('a kamikaze threatens the human but is no threat to other AI', () => {
    resetAiWeights();
    const s = midGameState();
    const kami = getGameState().players[1];
    kami.kamikaze = true;
    // Heavily arm the kamikaze so it WOULD threaten anyone it could reach.
    getGameState().planets[1].buildings.SILO = 3;
    getGameState().planets[1].buildings.BARRACKS = 3;
    getGameState().planets[1].troops = 30;
    kami.hand.ATTACK = 3;
    // With ONLY the kamikaze armed, a rival AI's planet is perfectly safe…
    expect(
      holdProbability(
        getGameState().players[2],
        getGameState().planets[2],
        getGameState().planets[2].troops,
      ),
    ).toBe(1);
    // …but the human's planet is not.
    expect(
      holdProbability(
        getGameState().players[0],
        getGameState().planets[0],
        getGameState().planets[0].troops,
      ),
    ).toBeLessThan(1);
  });
});

describe('mastermind in full headless games', () => {
  it('plays complete games without throwing and wins its share', async () => {
    resetAiWeights();
    let wins = 0;
    const games = 24;
    for (let g = 0; g < games; g++) {
      const result = await simulateGameWithPersonalities([]);
      expect(result.turns).toBeGreaterThan(0);
      expect(['conquest', 'timeout']).toContain(result.reason);
      if (result.winner?.id === 0) {
        wins++;
      }
    }
    // Non-flaky sanity floor: it must win SOMETHING across 24 games.
    expect(wins).toBeGreaterThan(0);
  }, 60_000);
});
