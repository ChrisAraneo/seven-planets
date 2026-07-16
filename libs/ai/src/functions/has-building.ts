import type { BuildingType, Player } from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';

export function hasBuilding(
  player: Player,
  buildingType: BuildingType,
): boolean {
  return getOwnedPlanets(player).some(
    (planet) => planet.buildings[buildingType],
  );
}
