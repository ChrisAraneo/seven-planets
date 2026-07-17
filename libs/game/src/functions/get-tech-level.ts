import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { getOwnedPlanets } from './get-owned-planets';
import { isFullyBuilt } from './is-fully-built';

const MAX_TECH_LEVEL = 4;

export function getTechLevel(state: GameState, player: Player): number {
  return getOwnedPlanets(state, player).some((planet) => isFullyBuilt(planet))
    ? MAX_TECH_LEVEL
    : computeTechFromSingularities(getOwnedPlanets(state, player));
}

function computeTechFromSingularities(planets: Planet[]): number {
  return (
    1 +
    Math.min(planets.filter((planet) => planet.buildings.SINGULARITY).length, 2)
  );
}
