import { getAiState } from '@/ai/state';
import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { effMinConquerProb } from './eff-min-conquer-prob';
import type { AttackPlan } from './evaluate-attacks';
import { evaluateAttacks } from './evaluate-attacks';

export function bestAttackNow(p: Player): AttackPlan | null {
  const aiState = getAiState();
  const s = getGameState();
  if ((p.hand.ATTACK || 0) < 1) {
    return null;
  }
  const holdFloor = p.kamikaze ? 0.05 : 0.2;
  const minHold = Math.max(
    holdFloor,
    aiState.W.minHoldProb * (p.kamikaze ? 0.5 : 1) -
      s.turn * aiState.W.aggressionRamp * 0.5,
  );
  for (const plan of evaluateAttacks(p)) {
    if (plan.score <= 0) {
      break;
    }
    if (plan.conquers) {
      if (plan.pWin >= effMinConquerProb(p) && plan.holdProb >= minHold) {
        return plan;
      }
    } else if (plan.score > 2) {
      return plan;
    }
  }
  return null;
}
