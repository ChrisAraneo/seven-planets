import { getTurn } from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';

export function isUnderTruce(planet: Planet): boolean {
  return getTurn() <= planet.protectedUntil;
}
