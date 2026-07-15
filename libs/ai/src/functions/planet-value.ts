import {
  BUILD_ORDER,
  BUILDINGS,
  CARDS,
  computeIncomeAmount,
} from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';

export function planetValue(planet: Planet): number {
  let eachValue = 6;
  for (const buildingType of BUILD_ORDER) {
    const lvl = planet.buildings[buildingType] || 0;
    if (!lvl) {
      continue;
    }
    eachValue += lvl * 1.5;
    const inc = BUILDINGS[buildingType].income;
    if (inc) {
      eachValue +=
        computeIncomeAmount(buildingType, lvl) * CARDS[inc].value * 3;
    }
  }
  eachValue +=
    (planet.buildings.SINGULARITY || 0) * 4 + (planet.buildings.LAB ? 2 : 0);
  return eachValue;
}
