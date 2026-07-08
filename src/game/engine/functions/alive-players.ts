import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function alivePlayers(): Player[] {
  const state = getGameState();
  return state.players.filter((p) => p.alive);
}
