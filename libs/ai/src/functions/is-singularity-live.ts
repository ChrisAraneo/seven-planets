import { getBuildingLevel } from '@seven-planets/game';
import { getMaxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { chain } from '../utils/chain';
import { computeTechLevel } from './compute-tech-level';
import { getOwnedPlanets } from './get-owned-planets';

export const isSingularityLive = (): boolean =>
  getAlivePlayers().some((player) =>
    getOwnedPlanets(player).some((planet) =>
      chain(getBuildingLevel(planet, 'SINGULARITY') + 1)
        .thru(
          (nextLevel) =>
            nextLevel <= getMaxLevel('SINGULARITY') &&
            nextLevel <= computeTechLevel(player) &&
            isSingularityLabOk(planet, nextLevel),
        )
        .value(),
    ),
  );
