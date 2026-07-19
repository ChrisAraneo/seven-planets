import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { canBuildSingularity } from './can-build-singularity';
import { getBuildingLevel } from './extractors/get-building-level';
import { getMaxLevel } from './extractors/get-max-level';
import { getOwnedPlanets } from './extractors/get-owned-planets';
import { getTechLevel } from './extractors/get-tech-level';
import { filterAlivePlayers } from './filter-alive-players';

const isSingularityReadyOn = (
  state: GameState,
  player: Player,
  planet: Planet,
): boolean =>
  chain(getBuildingLevel(planet, 'SINGULARITY') + 1)
    .thru(
      (next) =>
        next <= getMaxLevel('SINGULARITY') &&
        next <= getTechLevel(state, player) &&
        canBuildSingularity(planet, next),
    )
    .value();

export const isSingularityInPlay = (state: GameState): boolean =>
  filterAlivePlayers(state).some((player) =>
    getOwnedPlanets(state, player).some((planet) =>
      isSingularityReadyOn(state, player, planet),
    ),
  );
