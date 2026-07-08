import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { alivePlayers } from './alive-players';

export function turnOrder(): Player[] {
  const state = getGameState();
  const n = state.players.length;
  const order: Player[] = [];
  for (let i = 0; i < n; i++) {
    order.push(state.players[(state.startIdx + i) % n]);
  }
  return order.filter((p) => p.alive);
}
