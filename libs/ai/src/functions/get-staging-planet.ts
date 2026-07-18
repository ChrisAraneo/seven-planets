import type { Planet, Player } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getOwnedPlanets } from './get-owned-planets';

export const getStagingPlanet = (player: Player): Planet | null =>
  match(getOwnedPlanets(player).filter((planet) => planet.buildings.SILO))
    .when(
      (silos) => silos.length === 0,
      () => null,
    )
    .otherwise((silos) =>
      silos.reduce((best, candidatePlanet) =>
        match(
          getRocketCapacity(candidatePlanet) > getRocketCapacity(best) ||
            (getRocketCapacity(candidatePlanet) === getRocketCapacity(best) &&
              candidatePlanet.troops > best.troops),
        )
          .with(true, () => candidatePlanet)
          .otherwise(() => best),
      ),
    );
