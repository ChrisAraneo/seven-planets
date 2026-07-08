import type { GameState, Player } from '@/game/types';
import { alivePlayers } from './alive-players';

export function turnOrder(state: GameState): Player[] {
  const n = state.players.length;
  const order: Player[] = [];
  for (let i = 0; i < n; i++) {
    order.push(state.players[(state.startIdx + i) % n]);
  }
  return order.filter((p) => p.alive);
}
