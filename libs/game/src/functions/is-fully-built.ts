import { BUILD_ORDER, getMaxLevel } from '../config/constants';
import type { Planet } from '../interfaces/planet';

const SINGULARITY_BUILT_LEVEL = 3;

export function isFullyBuilt(planet: Planet): boolean {
  return BUILD_ORDER.every(
    (building) =>
      (building === 'SINGULARITY' &&
        (planet.buildings.SINGULARITY || 0) >= SINGULARITY_BUILT_LEVEL) ||
      (building !== 'SINGULARITY' &&
        (planet.buildings[building] || 0) >= getMaxLevel(building)),
  );
}
