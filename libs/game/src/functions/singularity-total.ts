import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';

// Sum of all Singularity levels across every planet the player owns (stacks).
export function singularityTotal(state: GameState, p: Player): number {
  return ownedPlanets(state, p).reduce(
    (s, pl) => s + (pl.buildings.SINGULARITY || 0),
    0,
  );
}
