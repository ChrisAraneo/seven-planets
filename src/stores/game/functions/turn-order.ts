import { getStartIdx } from '@/stores/game/getters/get-start-idx';
import type { GameState, Player } from '@/game/types';

export function turnOrder(state: GameState): Player[] {
  const n = state.players.length;
  const order: Player[] = [];
  for (let i = 0; i < n; i++) {
    order.push(state.players[(getStartIdx() + i) % n]);
  }
  return order.filter((p) => p.alive);
}
