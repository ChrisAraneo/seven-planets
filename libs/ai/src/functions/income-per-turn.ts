import { BUILD_ORDER, BUILDINGS, incomeAmount } from '@seven-planets/game';
import type { Cost, Player } from '@seven-planets/game';

import { owned } from './owned';

export function incomePerTurn(player: Player): Cost {
  const inc: Cost = {};
  for (const planet of owned(player)) {
    for (const buildingType of BUILD_ORDER) {
      const res = BUILDINGS[buildingType].income;
      if (res && planet.buildings[buildingType]) {
        inc[res] =
          (inc[res] || 0) +
          incomeAmount(buildingType, planet.buildings[buildingType]);
      }
    }
  }
  return inc;
}
