import { BUILD_ORDER } from '../config/constants';
import type { Planet } from '../interfaces/planet';
import { getMaxLevel } from './get-max-level';

const SINGULARITY_BUILT_LEVEL = 3;

export const isFullyBuilt = (planet: Planet): boolean =>
  BUILD_ORDER.every(
    (building) =>
      (building === 'SINGULARITY' &&
        (planet.buildings.SINGULARITY || 0) >= SINGULARITY_BUILT_LEVEL) ||
      (building !== 'SINGULARITY' &&
        (planet.buildings[building] || 0) >= getMaxLevel(building)),
  );
