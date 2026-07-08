import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { ownedPlanets } from './owned-planets';

// Sum of all Singularity levels across every planet the player owns (stacks).
export function singularityTotal(p: Player): number {
  const state = getGameState();
  return ownedPlanets(p).reduce(
    (s, pl) => s + (pl.buildings.SINGULARITY || 0),
    0,
  );
}
