import { isFullyBuilt } from '@/game/shared/is-fully-built';
// TECHNOLOGY LEVEL — caps how far any building can be upgraded. Two Singularities
import type { Player } from '@/game/types';

import { ownedPlanets } from './owned-planets';

// Give tech 3; a single FULLY BUILT planet lifts the owner to tech 4.
export function techLevel(p: Player): number {
  if (ownedPlanets(p).some(isFullyBuilt)) {
    return 4;
  }
  const sings = ownedPlanets(p).filter((pl) => pl.buildings.SINGULARITY).length;
  return sings >= 2 ? 3 : sings >= 1 ? 2 : 1;
}
