import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { getBuildingLevel } from './get-building-level';
import { getMaxLevel } from './get-max-level';
import { getOwnedPlanets } from './get-owned-planets';
import { getTechLevel } from './get-tech-level';
import { isSingularityLabOk } from './is-singularity-lab-ok';

const isReadyWithin = (planet: Planet, capacity: number): boolean =>
  chain(getBuildingLevel(planet, 'SINGULARITY') + 1)
    .thru((next) => next <= capacity && isSingularityLabOk(planet, next))
    .value();

export const getSingularityReadyPlanet = (
  state: GameState,
  player: Player,
): Planet | undefined =>
  chain(Math.min(getMaxLevel('SINGULARITY'), getTechLevel(state, player)))
    .thru((capacity) =>
      getOwnedPlanets(state, player).find((planet) =>
        isReadyWithin(planet, capacity),
      ),
    )
    .value();
