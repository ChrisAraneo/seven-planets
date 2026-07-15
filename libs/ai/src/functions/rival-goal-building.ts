import {
  computeBuildingCost,
  getMaxLevel,
  PRIORITIES,
} from '@seven-planets/game';
import type { BuildingType, Cost, Player } from '@seven-planets/game';

import { owned } from './owned';
import { techLevel } from './tech-level';

export function rivalGoalBuilding(
  player: Player,
): { id: BuildingType; cost: Cost } | null {
  const tech = techLevel(player);
  for (const id of PRIORITIES) {
    if (id === 'SINGULARITY') {
      continue;
    }
    const cap = Math.min(getMaxLevel(id), tech);
    const planet = owned(player).find(
      (planet) => (planet.buildings[id] || 0) < cap,
    );
    if (planet) {
      return {
        id,
        cost: computeBuildingCost(id, (planet.buildings[id] || 0) + 1),
      };
    }
  }
  return null;
}
