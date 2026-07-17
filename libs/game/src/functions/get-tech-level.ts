import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { computeTechFromSingularities } from './compute-tech-from-singularities';
import { getOwnedPlanets } from './get-owned-planets';
import { isFullyBuilt } from './is-fully-built';

const MAX_TECH_LEVEL = 4;

export const getTechLevel = (state: GameState, player: Player): number =>
  (getOwnedPlanets(state, player).some((planet) => isFullyBuilt(planet))
    ? MAX_TECH_LEVEL
    : computeTechFromSingularities(getOwnedPlanets(state, player)));
