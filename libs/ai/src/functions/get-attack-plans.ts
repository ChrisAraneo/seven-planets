import type { Planet, Player } from '@seven-planets/game';
import { getPlanets } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { COMBAT, CONQUEST_TRUCE } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import { range } from 'lodash-es';
import { match } from 'ts-pattern';

import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { canTarget } from './can-target';
import { computeAttackBase } from './compute-attack-base';
import { computeAverageStrength } from './compute-average-strength';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeDefenseBase } from './compute-defense-base';
import { computeEffectiveMinimumConquerProbability } from './compute-effective-minimum-conquer-probability';
import { computeHoldProbability } from './compute-hold-probability';
import { computeLossesOnDefeat } from './compute-losses-on-defeat';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computePlanetValue } from './compute-planet-value';
import { computePlayerStrength } from './compute-player-strength';
import { computeSurvivorsAfterWin } from './compute-survivors-after-win';
import { getOwnedPlanets } from './get-owned-planets';
import { isUnderTruce } from './is-under-truce';

export interface AttackPlan {
  source: Planet;
  target: Planet;
  n: number;
  pWin: number;
  willConquer: boolean;
  survivors: number;
  holdProb: number;
  value: number;
  score: number;
}

const getLossWeight = (player: Player): number =>
  getAiState().W.troopValue *
  match(player.isKamikaze)
    .with(true, () => 0.25)
    .otherwise(() => 1);

const buildConquestPlan = (
  player: Player,
  source: Planet,
  target: Planet,
  count: number,
  value: number,
): AttackPlan =>
  chain({
    winProbability: computeBattleWinProbability(
      computeAttackBase(count, source),
      computeDefenseBase(target),
    ),
    survivors: computeSurvivorsAfterWin(count),
  })
    .thru(({ winProbability, survivors }) =>
      chain(
        computeHoldProbability(
          player,
          target,
          survivors,
          getTurn() + CONQUEST_TRUCE,
        ),
      )
        .thru((holdProbability) => ({
          source,
          target,
          n: count,
          pWin: winProbability,
          willConquer: true,
          survivors,
          holdProb: holdProbability,
          value,
          score:
            winProbability * holdProbability * value -
            (winProbability * (count - survivors) +
              (1 - winProbability) * computeLossesOnDefeat(count)) *
              getLossWeight(player),
        }))
        .value(),
    )
    .value();

const computeTargetValue = (target: Planet, defenderOwner: Player): number =>
  computePlanetValue(target) +
  match(getOwnedPlanets(defenderOwner).length)
    .with(1, () => 10)
    .otherwise(() => 0) +
  match(computePlayerStrength(defenderOwner) > 1.25 * computeAverageStrength())
    .with(true, () => 4)
    .otherwise(() => 0);

const planConquest = (
  player: Player,
  source: Planet,
  target: Planet,
  defenderOwner: Player,
  maxTroops: number,
  troopsToConquer: number,
): AttackPlan =>
  chain({
    defenseBase: computeDefenseBase(target),
    minimumWinProbability: computeEffectiveMinimumConquerProbability(player),
    value: computeTargetValue(target, defenderOwner),
  })
    .thru(({ defenseBase, minimumWinProbability, value }) =>
      chain(
        range(troopsToConquer, maxTroops + 1).find(
          (candidate) =>
            computeBattleWinProbability(
              computeAttackBase(candidate, source),
              defenseBase,
            ) >= minimumWinProbability,
        ) ?? maxTroops,
      )
        .thru((leanTroops) =>
          [
            ...new Set([
              leanTroops,
              Math.ceil((leanTroops + maxTroops) / 2),
              maxTroops,
            ]),
          ]
            .map((count) =>
              buildConquestPlan(player, source, target, count, value),
            )
            .reduce((best, plan) =>
              match(plan.score > best.score)
                .with(true, () => plan)
                .otherwise(() => best),
            ),
        )
        .value(),
    )
    .value();

const planRaid = (
  player: Player,
  source: Planet,
  target: Planet,
  defenderOwner: Player,
  raidTroops: number,
): AttackPlan =>
  chain({
    winProbability: computeBattleWinProbability(
      computeAttackBase(raidTroops, source),
      computeDefenseBase(target),
    ),
    defenderLoss: Math.min(
      target.troops,
      Math.ceil((raidTroops * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den),
    ),
    survivors: computeSurvivorsAfterWin(raidTroops),
    zeal: match(player.isKamikaze)
      .with(true, () => 3)
      .otherwise(() =>
        match(
          computePlayerStrength(defenderOwner) > 1.3 * computeAverageStrength(),
        )
          .with(true, () => 1.4)
          .otherwise(() => 1.05),
      ),
  })
    .thru(({ winProbability, defenderLoss, survivors, zeal }) => ({
      source,
      target,
      n: raidTroops,
      pWin: winProbability,
      willConquer: false,
      survivors,
      holdProb: 0,
      value: defenderLoss,
      score:
        winProbability * defenderLoss * getAiState().W.troopValue * zeal -
        (winProbability * (raidTroops - survivors) +
          (1 - winProbability) * computeLossesOnDefeat(raidTroops)) *
          getLossWeight(player),
    }))
    .value();

const planStrikeFrom = (
  player: Player,
  source: Planet,
  target: Planet,
  defenderOwner: Player,
): AttackPlan | null =>
  match({
    hasSilo: Boolean(source.buildings.SILO),
    maxTroops: Math.min(
      getRocketCapacity(source),
      source.troops - getAiState().W.reserveTroops,
    ),
  })
    .when(
      ({ hasSilo, maxTroops }) => !hasSilo || maxTroops < 2,
      () => null,
    )
    .otherwise(({ maxTroops }) =>
      match(computeMinimumTroopsToConquer(target.troops))
        .when(
          (troopsToConquer) => maxTroops >= troopsToConquer,
          (troopsToConquer) =>
            planConquest(
              player,
              source,
              target,
              defenderOwner,
              maxTroops,
              troopsToConquer,
            ),
        )
        .otherwise(() =>
          planRaid(player, source, target, defenderOwner, maxTroops),
        ),
    );

export const getAttackPlans = (player: Player): AttackPlan[] =>
  match(player.hasPacifistStatus)
    .with(true, (): AttackPlan[] => [])
    .otherwise(() =>
      getPlanets()
        .flatMap((target) =>
          match(getPlayerByIndex(target.ownerId))
            .with(nullish, (): AttackPlan[] => [])
            .when(
              (defenderOwner) =>
                target.ownerId === player.id ||
                !defenderOwner.isAlive ||
                isUnderTruce(target) ||
                !canTarget(player, defenderOwner),
              (): AttackPlan[] => [],
            )
            .otherwise((defenderOwner) =>
              getOwnedPlanets(player).flatMap((source) =>
                match(planStrikeFrom(player, source, target, defenderOwner))
                  .with(nullish, (): AttackPlan[] => [])
                  .otherwise((plan) => [plan]),
              ),
            ),
        )
        .toSorted(
          (attackPlan, eachAttackPlan) =>
            eachAttackPlan.score - attackPlan.score,
        ),
    );
