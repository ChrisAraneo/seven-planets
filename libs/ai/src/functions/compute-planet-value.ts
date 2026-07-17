import type { Planet } from '@seven-planets/game';
import {
  BUILD_ORDER,
  BUILDINGS,
  CARDS,
  computeIncomeAmount,
} from '@seven-planets/game';

export function computePlanetValue(planet: Planet): number {
  let value = 6;
  for (const buildingType of BUILD_ORDER) {
    const level = planet.buildings[buildingType] || 0;
    if (level) {
      value += level * 1.5;
      const incomeResource = BUILDINGS[buildingType].income;
      if (incomeResource) {
        value +=
          computeIncomeAmount(buildingType, level) *
          CARDS[incomeResource].value *
          3;
      }
    }
  }
  value +=
    (planet.buildings.SINGULARITY || 0) * 4 + (planet.buildings.LAB ? 2 : 0);
  return value;
}
