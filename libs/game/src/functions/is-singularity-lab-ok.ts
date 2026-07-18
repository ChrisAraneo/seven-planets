import type { Planet } from '../interfaces/planet';
import { getBuildingLevel } from './get-building-level';
import { getMaxLevel } from './get-max-level';

export const isSingularityLabOk = (
  planet: Planet,
  nextLevel: number,
): boolean =>
  getBuildingLevel(planet, 'LAB') >= Math.min(nextLevel, getMaxLevel('LAB'));
