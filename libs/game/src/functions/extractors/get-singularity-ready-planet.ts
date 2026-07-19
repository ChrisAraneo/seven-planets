import type { GameState } from '../../interfaces/game-state';
import type { Planet } from '../../interfaces/planet';
import type { Player } from '../../interfaces/player';
import { chain } from '../../utils/chain';
import { canBuildSingularity } from '../can-build-singularity';
import { getBuildingLevel } from './get-building-level';
import { getMaxLevel } from './get-max-level';
import { getOwnedPlanets } from './get-owned-planets';
import { getTechLevel } from './get-tech-level';

// TODO: OK
export const getSingularityReadyPlanet = (
  state: GameState,
  player: Player,
): Planet | undefined =>
  chain(Math.min(getMaxLevel('SINGULARITY'), getTechLevel(state, player)))
    .thru((capacity) =>
      getOwnedPlanets(state, player).find((planet) =>
        chain(getBuildingLevel(planet, 'SINGULARITY') + 1)
          .thru((next) => next <= capacity && canBuildSingularity(planet, next))
          .value(),
      ),
    )
    .value();
