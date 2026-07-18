import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { getBuildingLevel } from './extractors/get-building-level';
import { getOwnedPlanets } from './extractors/get-owned-planets';

export const computeSingularityTotal = (
  state: GameState,
  player: Player,
): number =>
  getOwnedPlanets(state, player).reduce(
    (sum, planet) => sum + getBuildingLevel(planet, 'SINGULARITY'),
    0,
  );
