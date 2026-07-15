import { getPlanets } from '@seven-planets/game';
import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import { COMBAT, CONQUEST_TRUCE } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { attackBaseOf } from './attack-base-of';
import { avgStrength } from './avg-strength';
import { battleWinProb } from './battle-win-prob';
import { defenseBaseOf } from './defense-base-of';
import { effMinConquerProb } from './eff-min-conquer-prob';
import { holdProbability } from './hold-probability';
import { lossesOnDefeat } from './losses-on-defeat';
import { mayTarget } from './may-target';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { owned } from './owned';
import { planetValue } from './planet-value';
import { playerStrength } from './player-strength';
import { survivorsAfterWin } from './survivors-after-win';
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

export function evaluateAttacks(player: Player): AttackPlan[] {
  const aiState = getAiState();
  if (player.hasPacifistStatus) {
    return [];
  }
  const avgStr = avgStrength();
  const minWin = effMinConquerProb(player);
  // A kamikaze does not fear losing troops — expected losses barely register
  // when it scores a strike, so even long-shot attacks stay on the table.
  const lossWeight = aiState.W.troopValue * (player.isKamikaze ? 0.25 : 1);
  const plans: AttackPlan[] = [];
  for (const target of getPlanets()) {
    if (target.ownerId === player.id) {
      continue;
    }
    const defOwner = getPlayerByIndex(target.ownerId);
    if (!defOwner || !defOwner.isAlive || isUnderTruce(target)) {
      continue;
    }
    if (!mayTarget(player, defOwner)) {
      continue;
    }
    const def = defenseBaseOf(target);
    for (const source of owned(player)) {
      if (!source.buildings.SILO) {
        continue;
      }
      const maxN = Math.min(
        getRocketCapacity(source),
        source.troops - aiState.W.reserveTroops,
      );
      if (maxN < 2) {
        continue;
      }
      const nConq = minTroopsToConquer(target.troops);
      if (maxN >= nConq) {
        const value =
          planetValue(target) +
          (owned(defOwner).length === 1 ? 10 : 0) +
          (playerStrength(defOwner) > 1.25 * avgStr ? 4 : 0);
        let lean = nConq;
        while (
          lean < maxN &&
          battleWinProb(attackBaseOf(lean, source), def) < minWin
        ) {
          lean++;
        }
        let best: AttackPlan | null = null;
        for (const count of new Set([
          lean,
          Math.ceil((lean + maxN) / 2),
          maxN,
        ])) {
          const pWin = battleWinProb(attackBaseOf(count, source), def);
          const surv = survivorsAfterWin(count);
          const hold = holdProbability(
            player,
            target,
            surv,
            getTurn() + CONQUEST_TRUCE,
          );
          const eLoss =
            pWin * (count - surv) + (1 - pWin) * lossesOnDefeat(count);
          const plan: AttackPlan = {
            source,
            target,
            n: count,
            pWin,
            conquers: true,
            survivors: surv,
            holdProb: hold,
            value,
            score: pWin * hold * value - eLoss * lossWeight,
          };
          if (!best || plan.score > best.score) {
            best = plan;
          }
        }
        plans.push(best!);
      } else {
        const eachCount = maxN;
        const pWin = battleWinProb(attackBaseOf(eachCount, source), def);
        const defLoss = Math.min(
          target.troops,
          Math.ceil(
            (eachCount * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den,
          ),
        );
        const eLoss =
          pWin * (eachCount - survivorsAfterWin(eachCount)) +
          (1 - pWin) * lossesOnDefeat(eachCount);
        const zeal = player.isKamikaze
          ? 3
          : playerStrength(defOwner) > 1.3 * avgStr
            ? 1.4
            : 1.05;
        plans.push({
          source,
          target,
          n: eachCount,
          pWin,
          conquers: false,
          survivors: survivorsAfterWin(eachCount),
          holdProb: 0,
          value: defLoss,
          score:
            pWin * defLoss * aiState.W.troopValue * zeal - eLoss * lossWeight,
        });
      }
    }
  }
  return plans.sort(
    (attackPlan, eachAttackPlan) => eachAttackPlan.score - attackPlan.score,
  );
}
