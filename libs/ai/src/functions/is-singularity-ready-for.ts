import type { Player } from '@seven-planets/game';
import { getBuildingLevel } from '@seven-planets/game';
import { getMaxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';

import { chain } from '../utils/chain';
import { computeTechLevel } from './compute-tech-level';
import { getOwnedPlanets } from './get-owned-planets';

export const isSingularityReadyFor = (player: Player): boolean =>
  chain(Math.min(getMaxLevel('SINGULARITY'), computeTechLevel(player)))
    .thru((cap) =>
      getOwnedPlanets(player).some((planet) =>
        chain(getBuildingLevel(planet, 'SINGULARITY') + 1)
          .thru(
            (nextLevel) =>
              nextLevel <= cap && isSingularityLabOk(planet, nextLevel),
          )
          .value(),
      ),
    )
    .value();
