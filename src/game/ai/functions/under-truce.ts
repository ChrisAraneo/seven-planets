import type { Planet } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function underTruce(pl: Planet): boolean {
  const s = getGameState();
  return s.turn <= pl.protectedUntil;
}
