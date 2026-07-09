import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function alive(): Player[] {
  const s = getGameState();
  return s.players.filter((p) => p.alive);
}
