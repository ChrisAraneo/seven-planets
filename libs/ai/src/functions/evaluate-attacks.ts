import { getGameState } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import {
  COMBAT,
  CONQUEST_TRUCE,
  PACIFIST_DEF_BONUS,
  SHIELD_DEFENSE,
} from '@seven-planets/game';
import { rocketCap } from '@seven-planets/game';
import { siloBonus } from '@seven-planets/game';
import type { Planet, Player } from '@seven-planets/game';

import { alive } from './alive';
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

export function evaluateAttacks(p: Player): AttackPlan[] {
  const aiState = getAiState();
  if (p.hasPacifistStatus) {
    return [];
  }
  const avgStr = avgStrength();
  const minWin = effMinConquerProb(p);
  // A kamikaze does not fear losing troops — expected losses barely register
  // when it scores a strike, so even long-shot attacks stay on the table.
  const lossWeight = aiState.W.troopValue * (p.isKamikaze ? 0.25 : 1);
  const plans: AttackPlan[] = [];
  for (const target of getGameState().planets) {
    if (target.ownerId === p.id) {
      continue;
    }
    const defOwner = getGameState().players[target.ownerId];
    if (!defOwner.isAlive || isUnderTruce(target)) {
      continue;
    }
    if (!mayTarget(p, defOwner)) {
      continue;
    }
    const def = defenseBaseOf(target);
    for (const source of owned(p)) {
      if (!source.buildings.SILO) {
        continue;
      }
      const maxN = Math.min(
        rocketCap(source),
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
        for (const n of new Set([lean, Math.ceil((lean + maxN) / 2), maxN])) {
          const pWin = battleWinProb(attackBaseOf(n, source), def);
          const surv = survivorsAfterWin(n);
          const hold = holdProbability(
            p,
            target,
            surv,
            getTurn() + CONQUEST_TRUCE,
          );
          const eLoss = pWin * (n - surv) + (1 - pWin) * lossesOnDefeat(n);
          const plan: AttackPlan = {
            source,
            target,
            n,
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
        const n = maxN;
        const pWin = battleWinProb(attackBaseOf(n, source), def);
        const defLoss = Math.min(
          target.troops,
          Math.ceil((n * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den),
        );
        const eLoss =
          pWin * (n - survivorsAfterWin(n)) + (1 - pWin) * lossesOnDefeat(n);
        const zeal = p.isKamikaze
          ? 3
          : playerStrength(defOwner) > 1.3 * avgStr
            ? 1.4
            : 1.05;
        plans.push({
          source,
          target,
          n,
          pWin,
          conquers: false,
          survivors: survivorsAfterWin(n),
          holdProb: 0,
          value: defLoss,
          score:
            pWin * defLoss * aiState.W.troopValue * zeal - eLoss * lossWeight,
        });
      }
    }
  }
  return plans.sort((a, b) => b.score - a.score);
}
