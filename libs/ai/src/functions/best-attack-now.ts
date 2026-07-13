import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import type { Player } from '@seven-planets/game';

import { effMinConquerProb } from './eff-min-conquer-prob';
import type { AttackPlan } from './evaluate-attacks';
import { evaluateAttacks } from './evaluate-attacks';

export function bestAttackNow(player: Player): AttackPlan | null {
  const aiState = getAiState();
  if ((player.hand.ATTACK || 0) < 1) {
    return null;
  }
  // A kamikaze barely cares about keeping what it takes — hurting the human
  // is the whole point — so its hold requirements all but vanish.
  const holdFloor = player.isKamikaze ? 0.01 : 0.2;
  const minHold = Math.max(
    holdFloor,
    aiState.W.minHoldProb * (player.isKamikaze ? 0.15 : 1) -
      getTurn() * aiState.W.aggressionRamp * 0.5,
  );
  // ...and any raid with a positive score is worth launching for it.
  const raidScoreFloor = player.isKamikaze ? 0 : 2;
  for (const plan of evaluateAttacks(player)) {
    if (plan.score <= 0) {
      break;
    }
    if (plan.conquers) {
      if (plan.pWin >= effMinConquerProb(player) && plan.holdProb >= minHold) {
        return plan;
      }
    } else if (plan.score > raidScoreFloor) {
      return plan;
    }
  }
  return null;
}
