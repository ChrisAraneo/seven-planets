import {
  computeBuildingCost,
  getMaxLevel,
  PRIORITIES,
} from '@seven-planets/game';
import type { BuildingType, Cost, Player } from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';
import { computeTechLevel } from './compute-tech-level';

export function getRivalGoalBuilding(
  player: Player,
): { id: BuildingType; cost: Cost } | null {
  const techLevel = computeTechLevel(player);
  for (const buildingType of PRIORITIES) {
    if (buildingType === 'SINGULARITY') {
      continue;
    }
    const cap = Math.min(getMaxLevel(buildingType), techLevel);
    const planet = getOwnedPlanets(player).find(
      (ownedPlanet) => (ownedPlanet.buildings[buildingType] || 0) < cap,
    );
    if (planet) {
      return {
        id: buildingType,
        cost: computeBuildingCost(
          buildingType,
          (planet.buildings[buildingType] || 0) + 1,
        ),
      };
    }
  }
  return null;
}
