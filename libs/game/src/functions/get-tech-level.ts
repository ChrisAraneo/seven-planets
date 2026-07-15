import { isFullyBuilt } from './is-fully-built';
// TECHNOLOGY LEVEL — caps how far any building can be upgraded. Two Singularities
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

import { getOwnedPlanets } from './get-owned-planets';

// Short-circuit expression (4 is truthy): this sits in the AI's planning hot loop.
export function getTechLevel(state: GameState, player: Player): number {
  return (
    (getOwnedPlanets(state, player).some(isFullyBuilt) && 4) ||
    computeTechFromSingularities(getOwnedPlanets(state, player))
  );
}

// 0 → 1, 1 → 2, 2+ → 3, expressed as branch-free arithmetic.
function computeTechFromSingularities(planets: Planet[]): number {
  return (
    1 +
    Math.min(planets.filter((planet) => planet.buildings.SINGULARITY).length, 2)
  );
}
