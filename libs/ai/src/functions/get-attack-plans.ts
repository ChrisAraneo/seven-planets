import { getPlanets } from '@seven-planets/game';
import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import { COMBAT, CONQUEST_TRUCE } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { computeAttackBase } from './compute-attack-base';
import { computeAverageStrength } from './compute-average-strength';
import { computeBattleWinProbability } from './compute-battle-win-probability';
import { computeDefenseBase } from './compute-defense-base';
import { computeEffectiveMinimumConquerProbability } from './compute-effective-minimum-conquer-probability';
import { computeHoldProbability } from './compute-hold-probability';
import { computeLossesOnDefeat } from './compute-losses-on-defeat';
import { canTarget } from './can-target';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { getOwnedPlanets } from './get-owned-planets';
import { computePlanetValue } from './compute-planet-value';
import { computePlayerStrength } from './compute-player-strength';
import { computeSurvivorsAfterWin } from './compute-survivors-after-win';
import { isUnderTruce } from './is-under-truce';

export interface AttackPlan {
  source: Planet;
  target: Planet;
  n: number;
  pWin: number;
  conquers: boolean;
  survivors: number;
  holdProb: number;
  value: number;
  score: number;
}

export function getAttackPlans(player: Player): AttackPlan[] {
  const aiState = getAiState();
  if (player.hasPacifistStatus) {
    return [];
  }
  const averageStrength = computeAverageStrength();
  const minimumWinProbability =
    computeEffectiveMinimumConquerProbability(player);
  // A kamikaze does not fear losing troops — expected losses barely register
  // when it scores a strike, so even long-shot attacks stay on the table.
  const lossWeight = aiState.W.troopValue * (player.isKamikaze ? 0.25 : 1);
  const plans: AttackPlan[] = [];
  for (const target of getPlanets()) {
    if (target.ownerId === player.id) {
      continue;
    }
    const defenderOwner = getPlayerByIndex(target.ownerId);
    if (!defenderOwner || !defenderOwner.isAlive || isUnderTruce(target)) {
      continue;
    }
    if (!canTarget(player, defenderOwner)) {
      continue;
    }
    const defenseBase = computeDefenseBase(target);
    for (const source of getOwnedPlanets(player)) {
      if (!source.buildings.SILO) {
        continue;
      }
      const maxTroops = Math.min(
        getRocketCapacity(source),
        source.troops - aiState.W.reserveTroops,
      );
      if (maxTroops < 2) {
        continue;
      }
      const troopsToConquer = computeMinimumTroopsToConquer(target.troops);
      if (maxTroops >= troopsToConquer) {
        const value =
          computePlanetValue(target) +
          (getOwnedPlanets(defenderOwner).length === 1 ? 10 : 0) +
          (computePlayerStrength(defenderOwner) > 1.25 * averageStrength
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
        let best: AttackPlan | null = null;
        for (const count of new Set([
          leanTroops,
          Math.ceil((leanTroops + maxTroops) / 2),
          maxTroops,
        ])) {
          const winProbability = computeBattleWinProbability(
            computeAttackBase(count, source),
            defenseBase,
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
          const plan: AttackPlan = {
            source,
            target,
            n: count,
            pWin: winProbability,
            conquers: true,
            survivors,
            holdProb: holdProbability,
            value,
            score:
              winProbability * holdProbability * value -
              expectedLoss * lossWeight,
          };
          if (!best || plan.score > best.score) {
            best = plan;
          }
        }
        plans.push(best!);
      } else {
        const raidTroops = maxTroops;
        const winProbability = computeBattleWinProbability(
          computeAttackBase(raidTroops, source),
          defenseBase,
        );
        const defenderLoss = Math.min(
          target.troops,
          Math.ceil(
            (raidTroops * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den,
          ),
        );
        const expectedLoss =
          winProbability * (raidTroops - computeSurvivorsAfterWin(raidTroops)) +
          (1 - winProbability) * computeLossesOnDefeat(raidTroops);
        const zeal = player.isKamikaze
          ? 3
          : computePlayerStrength(defenderOwner) > 1.3 * averageStrength
            ? 1.4
            : 1.05;
        plans.push({
          source,
          target,
          n: raidTroops,
          pWin: winProbability,
          conquers: false,
          survivors: computeSurvivorsAfterWin(raidTroops),
          holdProb: 0,
          value: defenderLoss,
          score:
            winProbability * defenderLoss * aiState.W.troopValue * zeal -
            expectedLoss * lossWeight,
        });
      }
    }
  }
  return plans.sort(
    (attackPlan, eachAttackPlan) => eachAttackPlan.score - attackPlan.score,
  );
}
