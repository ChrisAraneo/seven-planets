import type { Player } from '@/game/types';
import { getAiStore } from '@/stores/ai';

export function aggression(p: Player): number {
  const aiState = getAiStore();
  if (p.pacifistStatus) {
    return 0;
  }
  return aiState.W.willNeutral;
}
