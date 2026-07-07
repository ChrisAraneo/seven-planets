import type { GameState, Planet } from '@/game/types';

export function underTruce(s: GameState, pl: Planet): boolean {
  return s.turn <= pl.protectedUntil;
}
