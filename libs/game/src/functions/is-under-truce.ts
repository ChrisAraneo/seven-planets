import { getTurn } from '../getters/get-turn';
import type { Planet } from '../interfaces/planet';

export function isUnderTruce(planet: Planet): boolean {
  return getTurn() <= planet.protectedUntil;
}
