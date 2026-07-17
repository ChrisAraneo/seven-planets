import type { BuildingType, Cost, Player } from '@seven-planets/game';
import {
  computeBuildingCost,
  getMaxLevel,
  PRIORITIES,
} from '@seven-planets/game';

import { computeTechLevel } from './compute-tech-level';
import { getOwnedPlanets } from './get-owned-planets';

export const getRivalGoalBuilding = (
  player: Player,
): { id: BuildingType; cost: Cost } | null => {
  const techLevel = computeTechLevel(player);
  for (const buildingType of PRIORITIES.filter(
    (candidate) => candidate !== 'SINGULARITY',
  )) {
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
};
