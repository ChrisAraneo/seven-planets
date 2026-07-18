import type { BuildingType } from '../interfaces/building-type';
import type { Planet } from '../interfaces/planet';

export const getBuildingLevel = (
  planet: Planet,
  buildingType: BuildingType,
): number => planet.buildings[buildingType] || 0;
