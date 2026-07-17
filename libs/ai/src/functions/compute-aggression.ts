import type { Player } from '@seven-planets/game';

import { getAiState } from '../state';

export function computeAggression(player: Player): number {
  const aiState = getAiState();
  if (player.hasPacifistStatus) {
    return 0;
  }
  if (player.isKamikaze) {
    return 1;
  }
  return aiState.W.willNeutral;
}
