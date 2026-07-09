import type { Player } from '@/game/types';

import { ownedPlanets } from '@/game/actions/common/owned-planets';

// Sum of all Singularity levels across every planet the player owns (stacks).
export function singularityTotal(p: Player): number {
  return ownedPlanets(p).reduce(
    (s, pl) => s + (pl.buildings.SINGULARITY || 0),
    0,
  );
}
