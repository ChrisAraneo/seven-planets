// @vitest-environment node
// The mastermind brain reads the game state like any player, so it can be
// Tested headless; full games run with IS_AUTO_HUMAN (no `document`). Importing
// The store seats the AI's getGameState() subscriptions, which answer every engine
// Park synchronously — whole games complete inside one simulateGame await.
import '@/stores';

import type { GameState } from '@seven-planets/game';
import { COMBAT } from '@seven-planets/game';
import { simulateGame } from '@seven-planets/game';
import { getGameStateLastValue, resetGameState } from '@seven-planets/game';
import { describe, expect, it } from 'vitest';

import { computeBattleWinProbability } from '../functions/compute-battle-win-probability';
import { computeHoldProbability } from '../functions/compute-hold-probability';
import { computeMastermindDraftPick } from '../functions/compute-mastermind-draft-pick';
import { computeMinimumTroopsToConquer } from '../functions/compute-minimum-troops-to-conquer';
import { computeSurvivorsAfterWin } from '../functions/compute-survivors-after-win';
import { getAttackPlans } from '../functions/get-attack-plans';
import { getBestAttackNow } from '../functions/get-best-attack-now';
import { getBuildCandidates } from '../functions/get-build-candidates';
import { getPlan } from '../functions/get-plan';
import { resetAiWeights } from '../functions/reset-ai-weights';

/** A deterministic mid-game state: player 0 is the mastermind. Installed as
    the live state, which is where the AI functions read it from. */
function midGameState(): GameState {
  resetGameState();
  const state = getGameStateLastValue();
  state.turn = 20;
  return state;
}

describe('mastermind combat analytics', () => {
  it('computes exact battle win probabilities', () => {
    // Overwhelming force
    expect(computeBattleWinProbability(100, 10)).toBe(1);
    // Hopeless
    expect(computeBattleWinProbability(0, 100)).toBe(0);
    // Equal bases: attacker needs a strictly higher roll — with two uniform
    // Rolls of 0..R the exact probability is R(R+1)/2 / (R+1)^2.
    const R = COMBAT.attackRoll;
    const exact = (R * (R + 1)) / 2 / ((R + 1) * (COMBAT.defenseRoll + 1));
    expect(computeBattleWinProbability(10, 10)).toBeCloseTo(exact, 10);
    // Monotonic in attacker strength.
    expect(computeBattleWinProbability(12, 10)).toBeGreaterThan(
      computeBattleWinProbability(10, 10),
    );
  });

  it('derives the minimum conquering force from the casualty fractions', () => {
    // Brute-force cross-check against the engine's formula:
    // A winning strike of n kills ceil(n·num/den) defenders.
    const { num, den } = COMBAT.winDefLoss;
    for (let troops = 1; troops <= 12; troops++) {
      let count = 1;
      while (Math.ceil((count * num) / den) < troops) {
        count++;
      }
      expect(computeMinimumTroopsToConquer(troops)).toBe(count);
    }
  });

  it('counts survivors after a winning strike', () => {
    const { num, den } = COMBAT.winAttLoss;
    for (const count of [2, 5, 6, 9, 17]) {
      expect(computeSurvivorsAfterWin(count)).toBe(
        count - Math.floor((count * num) / den),
      );
    }
  });
});

describe('mastermind retention forecast (computeHoldProbability)', () => {
  it('stays within [0,1] and drops when a rival grows stronger', () => {
    resetAiWeights();
    midGameState();
    const [player] = getGameStateLastValue().players;
    const [mine] = getGameStateLastValue().planets;
    // No rival has a silo yet — nobody can attack, we surely hold.
    expect(computeHoldProbability(player, mine, 5)).toBe(1);
    // Arm a rival heavily: retention must drop, but stay a probability.
    getGameStateLastValue().planets[1].buildings.SILO = 2;
    getGameStateLastValue().planets[1].buildings.BARRACKS = 2;
    getGameStateLastValue().planets[1].troops = 20;
    getGameStateLastValue().players[1].hand.ATTACK = 2;
    const threatened = computeHoldProbability(player, mine, 5);
    expect(threatened).toBeLessThan(1);
    expect(threatened).toBeGreaterThanOrEqual(0);
    // A bigger garrison holds better (or at least no worse).
    expect(computeHoldProbability(player, mine, 15)).toBeGreaterThanOrEqual(
      threatened,
    );
  });
});

describe('mastermind attack planning', () => {
  it('finds a high-confidence conquest and prices its retention', () => {
    resetAiWeights();
    midGameState();
    const [player] = getGameStateLastValue().players;
    // Cap 12
    getGameStateLastValue().planets[0].buildings.SILO = 2;
    getGameStateLastValue().planets[0].troops = 14;
    // Soft target
    getGameStateLastValue().planets[1].troops = 2;
    player.hand.ATTACK = 1;
    const plans = getAttackPlans(player);
    expect(plans.length).toBeGreaterThan(0);
    const [best] = plans;
    expect(best.willConquer).toBe(true);
    expect(best.pWin).toBeGreaterThan(0.6);
    expect(best.n).toBeGreaterThanOrEqual(
      computeMinimumTroopsToConquer(getGameStateLastValue().planets[1].troops),
    );
    expect(best.holdProb).toBeGreaterThanOrEqual(0);
    expect(best.holdProb).toBeLessThanOrEqual(1);
    const now = getBestAttackNow(player);
    expect(now).not.toBeNull();
    // Never commits more troops than the source can spare or the rocket holds.
    expect(now ? now.n : Infinity).toBeLessThanOrEqual(
      getGameStateLastValue().planets[0].troops,
    );
  });

  it('never plans an attack for a pacifist', () => {
    midGameState();
    const [player] = getGameStateLastValue().players;
    player.hasPacifistStatus = true;
    getGameStateLastValue().planets[0].buildings.SILO = 3;
    getGameStateLastValue().planets[0].troops = 30;
    player.hand.ATTACK = 3;
    expect(getAttackPlans(player)).toHaveLength(0);
    expect(getBestAttackNow(player)).toBeNull();
  });
});

describe('mastermind build planning and strategy', () => {
  it('proposes worthwhile builds and forms a plan', () => {
    resetAiWeights();
    midGameState();
    const [player] = getGameStateLastValue().players;
    player.hand.ORE = 3;
    player.hand.CRYSTAL = 3;
    player.hand.ENERGY = 3;
    const cands = getBuildCandidates(player);
    expect(cands.length).toBeGreaterThan(0);
    for (const buildCandidate of cands) {
      expect(buildCandidate.worth).toBeGreaterThan(0);
      expect(buildCandidate.pComplete).toBeGreaterThan(0);
      expect(buildCandidate.pComplete).toBeLessThanOrEqual(1);
    }
    const plan = getPlan(player);
    expect(plan.buildQueue.length).toBeGreaterThan(0);
    expect(plan.scores[plan.kind]).toBeGreaterThan(0);
    // The plan is cached for the turn (draft picks reuse one plan).
    expect(getPlan(player)).toBe(plan);
  });
});

describe('mastermind drafting', () => {
  it('picks a valid pool index and respects pickability', () => {
    resetAiWeights();
    const state = midGameState();
    const [player] = getGameStateLastValue().players;
    state.pool = ['ORE', 'CRYSTAL', 'ENERGY', 'ATTACK', 'RELIC'];
    const all = getGameStateLastValue().pool.map(() => true);
    const index = computeMastermindDraftPick(
      player,
      getGameStateLastValue().planets[0],
      all,
    );
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(getGameStateLastValue().pool.length);
    // Nothing pickable → pass.
    expect(
      computeMastermindDraftPick(
        player,
        getGameStateLastValue().planets[0],
        getGameStateLastValue().pool.map(() => false),
      ),
    ).toBe(-1);
    // Only slot 2 pickable → must take slot 2.
    const onlyTwo = getGameStateLastValue().pool.map((_, slot) => slot === 2);
    expect(
      computeMastermindDraftPick(
        player,
        getGameStateLastValue().planets[0],
        onlyTwo,
      ),
    ).toBe(2);
  });
});

describe('kamikaze (Hard mode) targeting', () => {
  it('a kamikaze only ever plans attacks against the human — never another AI', () => {
    resetAiWeights();
    midGameState();
    const [, kami] = getGameStateLastValue().players;
    kami.isKamikaze = true;
    // Arm the kamikaze with a real strike force.
    getGameStateLastValue().planets[1].buildings.SILO = 2;
    getGameStateLastValue().planets[1].troops = 16;
    kami.hand.ATTACK = 1;
    // Human — the ONLY legal target
    getGameStateLastValue().planets[0].troops = 2;
    // Rival AI — juicy but forbidden
    getGameStateLastValue().planets[2].troops = 2;
    const plans = getAttackPlans(kami);
    expect(plans.length).toBeGreaterThan(0);
    expect(
      plans.every(
        (attackPlan) =>
          getGameStateLastValue().planets[attackPlan.target.id].ownerId === 0,
      ),
    ).toBe(true);
    const now = getBestAttackNow(kami);
    expect(now).not.toBeNull();
    // Struck the human
    const strikeTargetOwner = now
      ? getGameStateLastValue().planets[now.target.id].ownerId
      : -1;
    expect(strikeTargetOwner).toBe(0);
  });

  it('a normal AI ignores kamikazes — never plans an attack against one', () => {
    resetAiWeights();
    midGameState();
    getGameStateLastValue().players[1].isKamikaze = true;
    // A normal AI (id 2) with a strike force.
    const normal = getGameStateLastValue().players[2];
    getGameStateLastValue().planets[2].buildings.SILO = 2;
    getGameStateLastValue().planets[2].troops = 16;
    normal.hand.ATTACK = 1;
    // Make the kamikaze's planet the softest target in the galaxy.
    getGameStateLastValue().planets[1].troops = 1;
    // Human, better defended
    getGameStateLastValue().planets[0].troops = 8;
    // Another rival
    getGameStateLastValue().planets[3].troops = 8;
    const plans = getAttackPlans(normal);
    // It may attack the human or other rivals, but NEVER the kamikaze (id 1).
    expect(
      plans.every(
        (attackPlan) =>
          getGameStateLastValue().planets[attackPlan.target.id].ownerId !== 1,
      ),
    ).toBe(true);
  });

  it('a kamikaze threatens the human but is no threat to other AI', () => {
    resetAiWeights();
    midGameState();
    const [, kami] = getGameStateLastValue().players;
    kami.isKamikaze = true;
    // Heavily arm the kamikaze so it WOULD threaten anyone it could reach.
    getGameStateLastValue().planets[1].buildings.SILO = 3;
    getGameStateLastValue().planets[1].buildings.BARRACKS = 3;
    getGameStateLastValue().planets[1].troops = 30;
    kami.hand.ATTACK = 3;
    // With ONLY the kamikaze armed, a rival AI's planet is perfectly safe…
    expect(
      computeHoldProbability(
        getGameStateLastValue().players[2],
        getGameStateLastValue().planets[2],
        getGameStateLastValue().planets[2].troops,
      ),
    ).toBe(1);
    // …but the human's planet is not.
    expect(
      computeHoldProbability(
        getGameStateLastValue().players[0],
        getGameStateLastValue().planets[0],
        getGameStateLastValue().planets[0].troops,
      ),
    ).toBeLessThan(1);
  });
});

describe('mastermind in full headless games', () => {
  it('plays complete games without throwing and wins its share', async () => {
    resetAiWeights();
    let wins = 0;
    const games = 24;
    for (let game = 0; game < games; game++) {
      const result = await simulateGame();
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
