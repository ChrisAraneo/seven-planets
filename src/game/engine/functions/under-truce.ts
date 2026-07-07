import type { Planet } from '@/game/types';
import { getState } from '../state';

export function underTruce(planet: Planet): boolean {
  return getState().turn <= planet.protectedUntil;
}
