import { getTurn } from '../getters/get-turn';
import type { Planet } from '../interfaces/planet';

export const isUnderTruce = (planet: Planet): boolean =>
  getTurn() <= planet.protectedUntil;
