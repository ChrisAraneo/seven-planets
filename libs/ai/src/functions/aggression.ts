import { getAiState } from '../state';
import type { Player } from '@seven-planets/game';

export function aggression(p: Player): number {
  const aiState = getAiState();
  if (p.pacifistStatus) {
    return 0;
  }
  return aiState.W.willNeutral;
}
