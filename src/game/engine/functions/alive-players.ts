import type { GameState, Player } from '@/game/types';

export function alivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.alive);
}
