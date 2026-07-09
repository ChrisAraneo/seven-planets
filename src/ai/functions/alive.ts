import { getGameState } from '@/stores/game-state';
import type { Player } from '@/game/types';

export function alive(): Player[] {
  return getGameState().players.filter((p) => p.alive);
}
