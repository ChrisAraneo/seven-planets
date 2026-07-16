import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import type { Player } from '@seven-planets/game';

import { KAMIKAZE_MIN_CONQUER_FLOOR, KAMIKAZE_RISK } from './ai-constants';
import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';

export function computeEffectiveMinimumConquerProbability(
  player?: Player,
): number {
  const aiState = getAiState();
  const duelBonus = getAlivePlayers().length === 2 ? 0.1 : 0;
  const recklessBonus = player?.isKamikaze ? KAMIKAZE_RISK : 0;
  // A kamikaze's floor is far lower: it keeps throwing troops at the human
  // even when a strike is likely to fail.
  return Math.max(
    player?.isKamikaze ? KAMIKAZE_MIN_CONQUER_FLOOR : 0.25,
    aiState.W.minConquerProb -
      getTurn() * aiState.W.aggressionRamp -
      duelBonus -
      recklessBonus,
  );
}
