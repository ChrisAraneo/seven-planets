import { chain } from 'lodash-es';
import { match } from 'ts-pattern';

import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';
import { computeTechFromSingularities } from '../compute-tech-from-singularities';
import { isFullyBuilt } from '../is-fully-built';
import { getOwnedPlanets } from './get-owned-planets';

const MAX_TECH_LEVEL = 4;

export const getTechLevel = (state: GameState, player: Player): number =>
  chain({
    ownedPlanets: getOwnedPlanets(state, player),
  })
    .thru(({ ownedPlanets }) =>
      match(ownedPlanets.some((planet) => isFullyBuilt(planet)))
        .with(true, () => MAX_TECH_LEVEL)
        .otherwise(() => computeTechFromSingularities(ownedPlanets)),
    )
    .value();
