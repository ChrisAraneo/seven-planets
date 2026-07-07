import type { GameState, Player } from '@/game/types';

export function alive(s: GameState): Player[] {
  return s.players.filter((p) => p.alive);
}
