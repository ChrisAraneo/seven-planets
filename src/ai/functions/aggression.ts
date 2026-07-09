import { getAiState } from '@/ai/state';
import type { Player } from '@/game/types';

export function aggression(p: Player): number {
  const aiState = getAiState();
  if (p.pacifistStatus) {
    return 0;
  }
  return aiState.W.willNeutral;
}
