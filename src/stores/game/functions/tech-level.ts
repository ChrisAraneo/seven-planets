import { isFullyBuilt } from '@/stores/game/functions/is-fully-built';
// TECHNOLOGY LEVEL — caps how far any building can be upgraded. Two Singularities
import type { GameState, Player } from '@/game/types';

import { ownedPlanets } from './owned-planets';

// Give tech 3; a single FULLY BUILT planet lifts the owner to tech 4.
export function techLevel(state: GameState, player: Player): number {
  if (ownedPlanets(state, player).some(isFullyBuilt)) {
    return 4;
  }

  const sings = ownedPlanets(state, player).filter(
    (planet) => planet.buildings.SINGULARITY,
  ).length;

  return sings >= 2 ? 3 : sings >= 1 ? 2 : 1;
}
