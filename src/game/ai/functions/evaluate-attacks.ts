import {
  COMBAT,
  CONQUEST_TRUCE,
  SHIELD_DEFENSE,
  PACIFIST_DEF_BONUS,
} from '@/game/constants';
import type { GameState, Planet, Player } from '@/game/types';
import { aiState } from './ai-state';
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
import { rocketCap } from './rocket-cap';
import { siloBonus } from './silo-bonus';
import { survivorsAfterWin } from './survivors-after-win';
import { underTruce } from './under-truce';

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

export function evaluateAttacks(s: GameState, p: Player): AttackPlan[] {
  if (p.pacifistStatus) {
    return [];
  }
  const avgStr = avgStrength(s);
  const minWin = effMinConquerProb(s, p);
  const plans: AttackPlan[] = [];
  for (const target of s.planets) {
    if (target.ownerId === p.id) {
      continue;
    }
    const defOwner = s.players[target.ownerId];
    if (!defOwner.alive || underTruce(s, target)) {
      continue;
    }
    if (!mayTarget(p, defOwner)) {
      continue;
    }
    const def = defenseBaseOf(s, target);
    for (const source of owned(s, p)) {
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
          planetValue(s, target) +
          (defOwner.planets.length === 1 ? 10 : 0) +
          (playerStrength(s, defOwner) > 1.25 * avgStr ? 4 : 0);
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
            s,
            p,
            target,
            surv,
            s.turn + CONQUEST_TRUCE,
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
            score: pWin * hold * value - eLoss * aiState.W.troopValue,
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
        const zeal = p.kamikaze
          ? 1.5
          : playerStrength(s, defOwner) > 1.3 * avgStr
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
            pWin * defLoss * aiState.W.troopValue * zeal -
            eLoss * aiState.W.troopValue,
        });
      }
    }
  }
  return plans.sort((a, b) => b.score - a.score);
}
