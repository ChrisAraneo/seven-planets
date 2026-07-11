import { buildingCost, maxLevel, PRIORITIES } from '@seven-planets/game';
import type { BuildingType, Cost, Player } from '@seven-planets/game';

import { owned } from './owned';
import { techLevel } from './tech-level';

export function rivalGoalBuilding(
  r: Player,
): { id: BuildingType; cost: Cost } | null {
  const tech = techLevel(r);
  for (const id of PRIORITIES) {
    if (id === 'SINGULARITY') {
      continue;
    }
    const cap = Math.min(maxLevel(id), tech);
    const pl = owned(r).find((x) => (x.buildings[id] || 0) < cap);
    if (pl) {
      return { id, cost: buildingCost(id, (pl.buildings[id] || 0) + 1) };
    }
  }
  return null;
}
