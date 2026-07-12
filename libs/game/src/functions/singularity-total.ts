import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';

// Sum of all Singularity levels across every planet the player owns (stacks).
export function singularityTotal(state: GameState, player: Player): number {
  return ownedPlanets(state, player).reduce(
    (sum, planet) => sum + (planet.buildings.SINGULARITY || 0),
    0,
  );
}
