import type { GameState, Planet } from '@/game/types';

export function underTruce(state: GameState, planet: Planet): boolean {
  return state.turn <= planet.protectedUntil;
}
