import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { filterAlivePlayers } from './filter-alive-players';
import { getBuildingLevel } from './get-building-level';
import { getMaxLevel } from './get-max-level';
import { getOwnedPlanets } from './get-owned-planets';
import { getTechLevel } from './get-tech-level';
import { isSingularityLabOk } from './is-singularity-lab-ok';

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
        isSingularityLabOk(planet, next),
    )
    .value();

export const isSingularityInPlay = (state: GameState): boolean =>
  filterAlivePlayers(state).some((player) =>
    getOwnedPlanets(state, player).some((planet) =>
      isSingularityReadyOn(state, player, planet),
    ),
  );
