import { getTurn } from '@/game/getters/get-turn';
import type { Planet } from '@/game/types';

export function isUnderTruce(planet: Planet): boolean {
  return getTurn() <= planet.protectedUntil;
}
