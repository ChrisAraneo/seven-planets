import type { Player } from '@seven-planets/game';
import { getBuildingLevel, PACIFIST_INFLUENCE } from '@seven-planets/game';
import { sumBy } from 'lodash-es';
import { match } from 'ts-pattern';

import { getOwnedPlanets } from './get-owned-planets';
import { hasBuilding } from './has-building';

export const computeInfluenceIncome = (player: Player): number =>
  sumBy(
    getOwnedPlanets(player),
    (planet) =>
      match(getBuildingLevel(planet, 'EMBASSY'))
        .when(
          (level) => level >= 2,
          () => 1,
        )
        .otherwise(() => 0) +
      match(player.hasPacifistStatus)
        .with(true, () => PACIFIST_INFLUENCE)
        .otherwise(() => 0),
  ) +
  match(hasBuilding(player, 'EMBASSY'))
    .with(true, () => 0.25)
    .otherwise(() => 0);
