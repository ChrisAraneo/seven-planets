import { min } from 'lodash-es';

import type { Planet } from '../interfaces/planet';
import { getBuildingLevel } from './extractors/get-building-level';
import { getMaxLevel } from './extractors/get-max-level';

// TODO: OK
export const canBuildSingularity = (
  planet: Planet,
  nextLevel: number,
): boolean =>
  getBuildingLevel(planet, 'LAB') >= min([nextLevel, getMaxLevel('LAB')]);
