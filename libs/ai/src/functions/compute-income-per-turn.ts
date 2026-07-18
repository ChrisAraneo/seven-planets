import type { Cost, Player } from '@seven-planets/game';
import {
  BUILD_ORDER,
  BUILDINGS,
  computeIncomeAmount,
  getBuildingLevel,
} from '@seven-planets/game';
import { match } from 'ts-pattern';

import { nonNullable } from '../utils/p';
import { getOwnedPlanets } from './get-owned-planets';

export const computeIncomePerTurn = (player: Player): Cost =>
  getOwnedPlanets(player).reduce<Cost>(
    (income, planet) =>
      BUILD_ORDER.reduce<Cost>(
        (acc, buildingType) =>
          match({
            incomeResource: BUILDINGS[buildingType].income,
            level: getBuildingLevel(planet, buildingType),
          })
            .with(
              { incomeResource: nonNullable },
              ({ level }) => level > 0,
              ({ incomeResource, level }) => ({
                ...acc,
                [incomeResource]:
                  (acc[incomeResource] || 0) +
                  computeIncomeAmount(buildingType, level),
              }),
            )
            .otherwise(() => acc),
        income,
      ),
    {},
  );
