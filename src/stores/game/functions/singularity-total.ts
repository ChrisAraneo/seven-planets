import type { GameState, Player } from '@/game/types';

import { ownedPlanets } from '@/stores/game/functions/owned-planets';

// Sum of all Singularity levels across every planet the player owns (stacks).
export function singularityTotal(state: GameState, p: Player): number {
  return ownedPlanets(state, p).reduce(
    (s, pl) => s + (pl.buildings.SINGULARITY || 0),
    0,
  );
}
