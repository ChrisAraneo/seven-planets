import { isFullyBuilt } from './is-fully-built';
// TECHNOLOGY LEVEL — caps how far any building can be upgraded. Two Singularities
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';

export function getTechLevel(state: GameState, player: Player): number {
  if (ownedPlanets(state, player).some(isFullyBuilt)) {
    return 4;
  }

  const sings = ownedPlanets(state, player).filter(
    (planet) => planet.buildings.SINGULARITY,
  ).length;

  return sings >= 2 ? 3 : sings >= 1 ? 2 : 1;
}
