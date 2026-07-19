import type { Player } from '@seven-planets/game';
import { isFullyBuilt } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getOwnedPlanets } from './get-owned-planets';

export const computeTechLevel = (player: Player): number =>
  match(getOwnedPlanets(player))
    .when(
      (planets) => planets.some((planet) => isFullyBuilt(planet)),
      () => 4,
    )
    .otherwise((planets) =>
      match(planets.filter((planet) => planet.buildings.SINGULARITY).length)
        .when(
          (count) => count >= 2,
          () => 3,
        )
        .when(
          (count) => count >= 1,
          () => 2,
        )
        .otherwise(() => 1),
    );
