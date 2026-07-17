import type { Planet, Player } from '@seven-planets/game';
import { getPlanets } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { COMBAT, CONQUEST_TRUCE } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';

import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { getAiState } from '../state';
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

export function getAttackPlans(player: Player): AttackPlan[] {
  if (player.hasPacifistStatus) {
    return [];
  }
  const plans: AttackPlan[] = [];
  for (const target of getPlanets()) {
    const defenderOwner = getPlayerByIndex(target.ownerId);
    const isViableTarget =
      target.ownerId !== player.id &&
      Boolean(defenderOwner?.isAlive) &&
      !isUnderTruce(target) &&
      Boolean(defenderOwner && canTarget(player, defenderOwner));
    if (isViableTarget && defenderOwner) {
      for (const source of getOwnedPlanets(player)) {
        const plan = planStrikeFrom(player, source, target, defenderOwner);
        if (plan) {
          plans.push(plan);
        }
      }
    }
  }
  return plans.toSorted(
    (attackPlan, eachAttackPlan) => eachAttackPlan.score - attackPlan.score,
  );
}

// A kamikaze does not fear losing troops — expected losses barely register
// When it scores a strike, so even long-shot attacks stay on the table.
function getLossWeight(player: Player): number {
  return getAiState().W.troopValue * (player.isKamikaze ? 0.25 : 1);
}

function planStrikeFrom(
  player: Player,
  source: Planet,
  target: Planet,
  defenderOwner: Player,
): AttackPlan | null {
  if (!source.buildings.SILO) {
    return null;
  }
  const maxTroops = Math.min(
    getRocketCapacity(source),
    source.troops - getAiState().W.reserveTroops,
  );
  if (maxTroops < 2) {
    return null;
  }
  const troopsToConquer = computeMinimumTroopsToConquer(target.troops);
  return maxTroops >= troopsToConquer
    ? planConquest(
        player,
        source,
        target,
        defenderOwner,
        maxTroops,
        troopsToConquer,
      )
    : planRaid(player, source, target, defenderOwner, maxTroops);
}

function planConquest(
  player: Player,
  source: Planet,
  target: Planet,
  defenderOwner: Player,
  maxTroops: number,
  troopsToConquer: number,
): AttackPlan {
  const defenseBase = computeDefenseBase(target);
  const minimumWinProbability =
    computeEffectiveMinimumConquerProbability(player);
  const value =
    computePlanetValue(target) +
    (getOwnedPlanets(defenderOwner).length === 1 ? 10 : 0) +
    (computePlayerStrength(defenderOwner) > 1.25 * computeAverageStrength()
      ? 4
      : 0);
  let leanTroops = troopsToConquer;
  while (
    leanTroops < maxTroops &&
    computeBattleWinProbability(
      computeAttackBase(leanTroops, source),
      defenseBase,
    ) < minimumWinProbability
  ) {
    leanTroops++;
  }
  return [
    ...new Set([
      leanTroops,
      Math.ceil((leanTroops + maxTroops) / 2),
      maxTroops,
    ]),
  ]
    .map((count) => buildConquestPlan(player, source, target, count, value))
    .reduce((best, plan) => (plan.score > best.score ? plan : best));
}

function buildConquestPlan(
  player: Player,
  source: Planet,
  target: Planet,
  count: number,
  value: number,
): AttackPlan {
  const winProbability = computeBattleWinProbability(
    computeAttackBase(count, source),
    computeDefenseBase(target),
  );
  const survivors = computeSurvivorsAfterWin(count);
  const holdProbability = computeHoldProbability(
    player,
    target,
    survivors,
    getTurn() + CONQUEST_TRUCE,
  );
  const expectedLoss =
    winProbability * (count - survivors) +
    (1 - winProbability) * computeLossesOnDefeat(count);
  return {
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
      expectedLoss * getLossWeight(player),
  };
}

function planRaid(
  player: Player,
  source: Planet,
  target: Planet,
  defenderOwner: Player,
  raidTroops: number,
): AttackPlan {
  const winProbability = computeBattleWinProbability(
    computeAttackBase(raidTroops, source),
    computeDefenseBase(target),
  );
  const defenderLoss = Math.min(
    target.troops,
    Math.ceil((raidTroops * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den),
  );
  const expectedLoss =
    winProbability * (raidTroops - computeSurvivorsAfterWin(raidTroops)) +
    (1 - winProbability) * computeLossesOnDefeat(raidTroops);
  const zeal = player.isKamikaze
    ? 3
    : computePlayerStrength(defenderOwner) > 1.3 * computeAverageStrength()
      ? 1.4
      : 1.05;
  return {
    source,
    target,
    n: raidTroops,
    pWin: winProbability,
    willConquer: false,
    survivors: computeSurvivorsAfterWin(raidTroops),
    holdProb: 0,
    value: defenderLoss,
    score:
      winProbability * defenderLoss * getAiState().W.troopValue * zeal -
      expectedLoss * getLossWeight(player),
  };
}
