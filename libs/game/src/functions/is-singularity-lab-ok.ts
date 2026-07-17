import type { Planet } from '../interfaces/planet';
import { getMaxLevel } from './get-max-level';

export const isSingularityLabOk = (
  planet: Planet,
  nextLevel: number,
): boolean =>
  (planet.buildings.LAB || 0) >= Math.min(nextLevel, getMaxLevel('LAB'));
