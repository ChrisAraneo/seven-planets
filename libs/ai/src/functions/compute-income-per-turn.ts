import type { Cost, Player } from '@seven-planets/game';
import {
  BUILD_ORDER,
  BUILDINGS,
  computeIncomeAmount,
} from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';

export const computeIncomePerTurn = (player: Player): Cost => {
  const income: Cost = {};
  for (const planet of getOwnedPlanets(player)) {
    for (const buildingType of BUILD_ORDER) {
      const incomeResource = BUILDINGS[buildingType].income;
      if (incomeResource && planet.buildings[buildingType]) {
        income[incomeResource] =
          (income[incomeResource] || 0) +
          computeIncomeAmount(buildingType, planet.buildings[buildingType]);
      }
    }
  }
  return income;
};
