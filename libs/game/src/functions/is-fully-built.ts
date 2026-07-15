import { BUILD_ORDER, getMaxLevel } from '../config/constants';
import type { Planet } from '../interfaces/planet';

// A planet is FULLY BUILT once every building except the Singularity sits at its
// Maximum level and the Singularity itself has reached level 3. Owning one grants
// TECHNOLOGY 4 — the tier that unlocks the level-4 Singularity.
// Short-circuit expressions instead of a branch: AI planning hot loop.
export function isFullyBuilt(planet: Planet): boolean {
  return BUILD_ORDER.every(
    (building) =>
      (building === 'SINGULARITY' &&
        (planet.buildings.SINGULARITY || 0) >= 3) ||
      (building !== 'SINGULARITY' &&
        (planet.buildings[building] || 0) >= getMaxLevel(building)),
  );
}
