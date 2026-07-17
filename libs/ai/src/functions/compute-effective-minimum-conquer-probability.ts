import type { Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { getAiState } from '../state';
import { KAMIKAZE_MIN_CONQUER_FLOOR, KAMIKAZE_RISK } from './ai-constants';

export const computeEffectiveMinimumConquerProbability = (
  player?: Player,
): number => {
  const aiState = getAiState();
  const duelBonus = getAlivePlayers().length === 2 ? 0.1 : 0;
  const recklessBonus = player?.isKamikaze ? KAMIKAZE_RISK : 0;
  return Math.max(
    player?.isKamikaze ? KAMIKAZE_MIN_CONQUER_FLOOR : 0.25,
    aiState.W.minConquerProb -
      getTurn() * aiState.W.aggressionRamp -
      duelBonus -
      recklessBonus,
  );
};
