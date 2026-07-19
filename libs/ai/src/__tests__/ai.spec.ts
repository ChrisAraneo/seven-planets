// @vitest-environment node
import '@/stores';

import type { GameState } from '@seven-planets/game';
import { COMBAT } from '@seven-planets/game';
import { simulateGame } from '@seven-planets/game';
import { getGameStateLastValue, resetGameState } from '@seven-planets/game';
import { assign, noop, range, times } from 'lodash-es';
import { match } from 'ts-pattern';
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
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';

const midGameState = (): GameState =>
  chain(resetGameState())
    .thru(() => getGameStateLastValue())
    .tap((state) => assign(state, { turn: 20 }))
    .value();

describe('mastermind combat analytics', () => {
  it('computes exact battle win probabilities', () =>
    chain(COMBAT.attackRoll)
      .thru((attackRoll) => ({
        exact:
          (attackRoll * (attackRoll + 1)) /
          2 /
          ((attackRoll + 1) * (COMBAT.defenseRoll + 1)),
      }))
      .tap(() => expect(computeBattleWinProbability(100, 10)).toBe(1))
      .tap(() => expect(computeBattleWinProbability(0, 100)).toBe(0))
      .tap(({ exact }) =>
        expect(computeBattleWinProbability(10, 10)).toBeCloseTo(exact, 10),
      )
      .tap(() =>
        expect(computeBattleWinProbability(12, 10)).toBeGreaterThan(
          computeBattleWinProbability(10, 10),
        ),
      )
      .thru(noop)
      .value());

  it('derives the minimum conquering force from the casualty fractions', () =>
    chain(COMBAT.winDefLoss)
      .tap(({ num, den }) =>
        range(1, 13).forEach((troops) =>
          expect(computeMinimumTroopsToConquer(troops)).toBe(
            range(1, 200).find(
              (count) => Math.ceil((count * num) / den) >= troops,
            ),
          ),
        ),
      )
      .thru(noop)
      .value());

  it('counts survivors after a winning strike', () =>
    chain(COMBAT.winAttLoss)
      .tap(({ num, den }) =>
        [2, 5, 6, 9, 17].forEach((count) =>
          expect(computeSurvivorsAfterWin(count)).toBe(
            count - Math.floor((count * num) / den),
          ),
        ),
      )
      .thru(noop)
      .value());
});

describe('mastermind retention forecast (computeHoldProbability)', () => {
  it('stays within [0,1] and drops when a rival grows stronger', () =>
    chain(resetAiWeights())
      .tap(() => midGameState())
      .thru(() => ({
        player: getGameStateLastValue().players[0],
        mine: getGameStateLastValue().planets[0],
      }))
      .tap(({ player, mine }) =>
        expect(computeHoldProbability(player, mine, 5)).toBe(1),
      )
      .tap(() =>
        assign(getGameStateLastValue().planets[1].buildings, {
          SILO: 2,
          BARRACKS: 2,
        }),
      )
      .tap(() => assign(getGameStateLastValue().planets[1], { troops: 20 }))
      .tap(() => assign(getGameStateLastValue().players[1].hand, { ATTACK: 2 }))
      .thru(({ player, mine }) => ({
        player,
        mine,
        threatened: computeHoldProbability(player, mine, 5),
      }))
      .tap(({ threatened }) => expect(threatened).toBeLessThan(1))
      .tap(({ threatened }) => expect(threatened).toBeGreaterThanOrEqual(0))
      .tap(({ player, mine, threatened }) =>
        expect(computeHoldProbability(player, mine, 15)).toBeGreaterThanOrEqual(
          threatened,
        ),
      )
      .thru(noop)
      .value());
});

describe('mastermind attack planning', () => {
  it('finds a high-confidence conquest and prices its retention', () =>
    chain(resetAiWeights())
      .tap(() => midGameState())
      .thru(() => getGameStateLastValue().players[0])
      .tap(() =>
        assign(getGameStateLastValue().planets[0].buildings, { SILO: 2 }),
      )
      .tap(() => assign(getGameStateLastValue().planets[0], { troops: 14 }))
      .tap(() => assign(getGameStateLastValue().planets[1], { troops: 2 }))
      .tap((player) => assign(player.hand, { ATTACK: 1 }))
      .thru((player) => ({ player, plans: getAttackPlans(player) }))
      .tap(({ plans }) => expect(plans.length).toBeGreaterThan(0))
      .tap(({ plans }) => expect(plans[0].willConquer).toBe(true))
      .tap(({ plans }) => expect(plans[0].pWin).toBeGreaterThan(0.6))
      .tap(({ plans }) =>
        expect(plans[0].n).toBeGreaterThanOrEqual(
          computeMinimumTroopsToConquer(
            getGameStateLastValue().planets[1].troops,
          ),
        ),
      )
      .tap(({ plans }) => expect(plans[0].holdProb).toBeGreaterThanOrEqual(0))
      .tap(({ plans }) => expect(plans[0].holdProb).toBeLessThanOrEqual(1))
      .thru(({ player }) => ({ now: getBestAttackNow(player) }))
      .tap(({ now }) => expect(now).not.toBeNull())
      .tap(({ now }) =>
        expect(
          match(now)
            .with(nullish, () => Infinity)
            .otherwise((strike) => strike.n),
        ).toBeLessThanOrEqual(getGameStateLastValue().planets[0].troops),
      )
      .thru(noop)
      .value());

  it('never plans an attack for a pacifist', () =>
    chain(midGameState())
      .thru(() => getGameStateLastValue().players[0])
      .tap((player) => assign(player, { hasPacifistStatus: true }))
      .tap(() =>
        assign(getGameStateLastValue().planets[0].buildings, { SILO: 3 }),
      )
      .tap(() => assign(getGameStateLastValue().planets[0], { troops: 30 }))
      .tap((player) => assign(player.hand, { ATTACK: 3 }))
      .tap((player) => expect(getAttackPlans(player)).toHaveLength(0))
      .tap((player) => expect(getBestAttackNow(player)).toBeNull())
      .thru(noop)
      .value());
});

describe('mastermind build planning and strategy', () => {
  it('proposes worthwhile builds and forms a plan', () =>
    chain(resetAiWeights())
      .tap(() => midGameState())
      .thru(() => getGameStateLastValue().players[0])
      .tap((player) => assign(player.hand, { ORE: 3, CRYSTAL: 3, ENERGY: 3 }))
      .thru((player) => ({ player, cands: getBuildCandidates(player) }))
      .tap(({ cands }) => expect(cands.length).toBeGreaterThan(0))
      .tap(({ cands }) =>
        cands.forEach((buildCandidate) =>
          chain(expect(buildCandidate.worth).toBeGreaterThan(0))
            .tap(() => expect(buildCandidate.pComplete).toBeGreaterThan(0))
            .tap(() => expect(buildCandidate.pComplete).toBeLessThanOrEqual(1))
            .thru(noop)
            .value(),
        ),
      )
      .thru(({ player }) => ({ player, plan: getPlan(player) }))
      .tap(({ plan }) => expect(plan.buildQueue.length).toBeGreaterThan(0))
      .tap(({ plan }) => expect(plan.scores[plan.kind]).toBeGreaterThan(0))
      .tap(({ player, plan }) => expect(getPlan(player)).toBe(plan))
      .thru(noop)
      .value());
});

describe('mastermind drafting', () => {
  it('picks a valid pool index and respects pickability', () =>
    chain(resetAiWeights())
      .thru(() => midGameState())
      .tap((state) =>
        assign(state, {
          pool: ['ORE', 'CRYSTAL', 'ENERGY', 'ATTACK', 'RELIC'],
        }),
      )
      .thru(() => getGameStateLastValue().players[0])
      .thru((player) => ({
        player,
        index: computeMastermindDraftPick(
          player,
          getGameStateLastValue().planets[0],
          getGameStateLastValue().pool.map(() => true),
        ),
      }))
      .tap(({ index }) => expect(index).toBeGreaterThanOrEqual(0))
      .tap(({ index }) =>
        expect(index).toBeLessThan(getGameStateLastValue().pool.length),
      )
      .tap(({ player }) =>
        expect(
          computeMastermindDraftPick(
            player,
            getGameStateLastValue().planets[0],
            getGameStateLastValue().pool.map(() => false),
          ),
        ).toBe(-1),
      )
      .tap(({ player }) =>
        expect(
          computeMastermindDraftPick(
            player,
            getGameStateLastValue().planets[0],
            getGameStateLastValue().pool.map((_, slot) => slot === 2),
          ),
        ).toBe(2),
      )
      .thru(noop)
      .value());
});

describe('kamikaze (Hard mode) targeting', () => {
  it('a kamikaze only ever plans attacks against the human — never another AI', () =>
    chain(resetAiWeights())
      .tap(() => midGameState())
      .thru(() => getGameStateLastValue().players[1])
      .tap((kami) => assign(kami, { isKamikaze: true }))
      .tap(() =>
        assign(getGameStateLastValue().planets[1].buildings, { SILO: 2 }),
      )
      .tap(() => assign(getGameStateLastValue().planets[1], { troops: 16 }))
      .tap((kami) => assign(kami.hand, { ATTACK: 1 }))
      .tap(() => assign(getGameStateLastValue().planets[0], { troops: 2 }))
      .tap(() => assign(getGameStateLastValue().planets[2], { troops: 2 }))
      .thru((kami) => ({ kami, plans: getAttackPlans(kami) }))
      .tap(({ plans }) => expect(plans.length).toBeGreaterThan(0))
      .tap(({ plans }) =>
        expect(
          plans.every(
            (attackPlan) =>
              getGameStateLastValue().planets[attackPlan.target.id].ownerId ===
              0,
          ),
        ).toBe(true),
      )
      .thru(({ kami }) => getBestAttackNow(kami))
      .tap((now) => expect(now).not.toBeNull())
      .tap((now) =>
        expect(
          match(now)
            .with(nullish, () => -1)
            .otherwise(
              (strike) =>
                getGameStateLastValue().planets[strike.target.id].ownerId,
            ),
        ).toBe(0),
      )
      .thru(noop)
      .value());

  it('a normal AI ignores kamikazes — never plans an attack against 1', () =>
    chain(resetAiWeights())
      .tap(() => midGameState())
      .tap(() =>
        assign(getGameStateLastValue().players[1], { isKamikaze: true }),
      )
      .thru(() => getGameStateLastValue().players[2])
      .tap(() =>
        assign(getGameStateLastValue().planets[2].buildings, { SILO: 2 }),
      )
      .tap(() => assign(getGameStateLastValue().planets[2], { troops: 16 }))
      .tap((normal) => assign(normal.hand, { ATTACK: 1 }))
      .tap(() => assign(getGameStateLastValue().planets[1], { troops: 1 }))
      .tap(() => assign(getGameStateLastValue().planets[0], { troops: 8 }))
      .tap(() => assign(getGameStateLastValue().planets[3], { troops: 8 }))
      .thru((normal) => getAttackPlans(normal))
      .tap((plans) =>
        expect(
          plans.every(
            (attackPlan) =>
              getGameStateLastValue().planets[attackPlan.target.id].ownerId !==
              1,
          ),
        ).toBe(true),
      )
      .thru(noop)
      .value());

  it('a kamikaze threatens the human but is no threat to other AI', () =>
    chain(resetAiWeights())
      .tap(() => midGameState())
      .thru(() => getGameStateLastValue().players[1])
      .tap((kami) => assign(kami, { isKamikaze: true }))
      .tap(() =>
        assign(getGameStateLastValue().planets[1].buildings, {
          SILO: 3,
          BARRACKS: 3,
        }),
      )
      .tap(() => assign(getGameStateLastValue().planets[1], { troops: 30 }))
      .tap((kami) => assign(kami.hand, { ATTACK: 3 }))
      .tap(() =>
        expect(
          computeHoldProbability(
            getGameStateLastValue().players[2],
            getGameStateLastValue().planets[2],
            getGameStateLastValue().planets[2].troops,
          ),
        ).toBe(1),
      )
      .tap(() =>
        expect(
          computeHoldProbability(
            getGameStateLastValue().players[0],
            getGameStateLastValue().planets[0],
            getGameStateLastValue().planets[0].troops,
          ),
        ).toBeLessThan(1),
      )
      .thru(noop)
      .value());
});

describe('mastermind in full headless games', () => {
  it(
    'plays complete games without throwing and wins its share',
    () =>
      chain(resetAiWeights())
        .thru(() =>
          times(24, noop).reduce(
            (prev: Promise<number>) =>
              prev.then((wins) =>
                simulateGame().then((result) =>
                  chain(expect(result.turns).toBeGreaterThan(0))
                    .tap(() =>
                      expect(['CONQUEST', 'timeout']).toContain(result.reason),
                    )
                    .thru(() =>
                      match(result.winner?.id)
                        .with(0, () => wins + 1)
                        .otherwise(() => wins),
                    )
                    .value(),
                ),
              ),
            Promise.resolve(0),
          ),
        )
        .thru((totalWins) =>
          totalWins.then((wins) => expect(wins).toBeGreaterThan(0)),
        )
        .value(),
    60_000,
  );
});
