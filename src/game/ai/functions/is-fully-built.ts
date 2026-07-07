import { BUILD_ORDER, maxLevel } from '@/game/constants';
import type { Planet } from '@/game/types';

// A planet with every non-Singularity building maxed and a level-3 Singularity is
// FULLY BUILT — owning one lifts the player to TECHNOLOGY 4.
export function isFullyBuilt(pl: Planet): boolean {
  return BUILD_ORDER.every((b) =>
    b === 'SINGULARITY'
      ? (pl.buildings.SINGULARITY || 0) >= 3
      : (pl.buildings[b] || 0) >= maxLevel(b),
  );
}
