import { BUILD_ORDER } from '../config/constants';
import type { Planet } from '../interfaces/planet';
import { getBuildingLevel } from './get-building-level';
import { getMaxLevel } from './get-max-level';

const SINGULARITY_BUILT_LEVEL = 3;

export const isFullyBuilt = (planet: Planet): boolean =>
  BUILD_ORDER.every(
    (building) =>
      (building === 'SINGULARITY' &&
        getBuildingLevel(planet, 'SINGULARITY') >= SINGULARITY_BUILT_LEVEL) ||
      (building !== 'SINGULARITY' &&
        getBuildingLevel(planet, building) >= getMaxLevel(building)),
  );
