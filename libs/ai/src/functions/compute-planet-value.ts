import type { Planet } from '@seven-planets/game';
import {
  BUILD_ORDER,
  BUILDINGS,
  CARDS,
  computeIncomeAmount,
  getBuildingLevel,
} from '@seven-planets/game';
import { sumBy } from 'lodash-es';
import { match } from 'ts-pattern';

import { nullish } from '../utils/p';

export const computePlanetValue = (planet: Planet): number =>
  6 +
  sumBy(BUILD_ORDER, (buildingType) =>
    match(getBuildingLevel(planet, buildingType))
      .with(0, () => 0)
      .otherwise(
        (level) =>
          level * 1.5 +
          match(BUILDINGS[buildingType].income)
            .with(nullish, () => 0)
            .otherwise(
              (incomeResource) =>
                computeIncomeAmount(buildingType, level) *
                CARDS[incomeResource].value *
                3,
            ),
      ),
  ) +
  getBuildingLevel(planet, 'SINGULARITY') * 4 +
  match(planet.buildings.LAB)
    .when(Boolean, () => 2)
    .otherwise(() => 0);
