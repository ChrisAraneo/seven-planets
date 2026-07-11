import { getAiState } from '../state';
import type { Player } from '@seven-planets/game';

export function aggression(p: Player): number {
  const aiState = getAiState();
  if (p.hasPacifistStatus) {
    return 0;
  }
  if (p.isKamikaze) {
    // A kamikaze attacks whenever it can — model it as maximally aggressive.
    return 1;
  }
  return aiState.W.willNeutral;
}
