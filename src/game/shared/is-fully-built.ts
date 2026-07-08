import { BUILD_ORDER, maxLevel } from '@/game/constants';
import type { Planet } from '@/game/types';

// A planet is FULLY BUILT once every building except the Singularity sits at its
// Maximum level and the Singularity itself has reached level 3. Owning one grants
// TECHNOLOGY 4 — the tier that unlocks the level-4 Singularity.
export function isFullyBuilt(pl: Planet): boolean {
  return BUILD_ORDER.every((b) =>
    b === 'SINGULARITY'
      ? (pl.buildings.SINGULARITY || 0) >= 3
      : (pl.buildings[b] || 0) >= maxLevel(b),
  );
}
