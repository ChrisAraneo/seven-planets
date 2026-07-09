import { getGameState } from '@/stores/game-state';
import { getStartIdx } from '@/stores/game/getters/get-start-idx';
import type { Player } from '@/game/types';

import { filterAlivePlayers } from '@/game/actions/common/alive-players';

export function turnOrder(): Player[] {
  const n = getGameState().players.length;
  const order: Player[] = [];
  for (let i = 0; i < n; i++) {
    order.push(getGameState().players[(getStartIdx() + i) % n]);
  }
  return order.filter((p) => p.alive);
}
