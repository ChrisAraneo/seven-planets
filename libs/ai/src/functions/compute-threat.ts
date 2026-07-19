import type { Player } from '@seven-planets/game';
import { sumBy } from 'lodash-es';
import { match } from 'ts-pattern';

import { computeHoldProbability } from './compute-hold-probability';
import { computePlanetValue } from './compute-planet-value';
import { getOwnedPlanets } from './get-owned-planets';

export const computeThreat = (player: Player): number =>
  sumBy(
    getOwnedPlanets(player),
    (planet) =>
      (1 - computeHoldProbability(player, planet, planet.troops)) *
      computePlanetValue(planet) *
      match(getOwnedPlanets(player).length)
        .with(1, () => 3)
        .otherwise(() => 0.6),
  );
