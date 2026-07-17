import type { Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';

import { getAiState } from '../state';
import { computeEffectiveMinimumConquerProbability } from './compute-effective-minimum-conquer-probability';
import type { AttackPlan } from './get-attack-plans';
import { getAttackPlans } from './get-attack-plans';

export function getBestAttackNow(player: Player): AttackPlan | null {
  const aiState = getAiState();
  if ((player.hand.ATTACK || 0) < 1) {
    return null;
  }
  // A kamikaze barely cares about keeping what it takes — hurting the human
  // Is the whole point — so its hold requirements all but vanish.
  const holdFloor = player.isKamikaze ? 0.01 : 0.2;
  const minimumHold = Math.max(
    holdFloor,
    aiState.W.minHoldProb * (player.isKamikaze ? 0.15 : 1) -
      getTurn() * aiState.W.aggressionRamp * 0.5,
  );
  // ...and any raid with a positive score is worth launching for it.
  const raidScoreFloor = player.isKamikaze ? 0 : 2;
  for (const plan of getAttackPlans(player)) {
    if (plan.score <= 0) {
      break;
    }
    if (plan.willConquer) {
      if (
        plan.pWin >= computeEffectiveMinimumConquerProbability(player) &&
        plan.holdProb >= minimumHold
      ) {
        return plan;
      }
    } else if (plan.score > raidScoreFloor) {
      return plan;
    }
  }
  return null;
}
