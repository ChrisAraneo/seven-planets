import type { BuildingType, Player } from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';

export const hasBuilding = (
  player: Player,
  buildingType: BuildingType,
): boolean =>
  getOwnedPlanets(player).some((planet) => planet.buildings[buildingType]);
