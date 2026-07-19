import type { Planet } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';

export const isUnderTruce = (planet: Planet): boolean =>
  getTurn() <= planet.protectedUntil;
