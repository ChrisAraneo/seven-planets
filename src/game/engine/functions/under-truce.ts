import type { Planet } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function underTruce(planet: Planet): boolean {
  const state = getGameState();
  return state.turn <= planet.protectedUntil;
}
