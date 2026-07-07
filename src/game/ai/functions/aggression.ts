import type { Player } from '@/game/types';
import { aiState } from './ai-state';

export function aggression(p: Player): number {
  if (p.pacifistStatus) {
    return 0;
  }
  return aiState.W.willNeutral;
}
