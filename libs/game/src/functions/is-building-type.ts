import { BUILD_ORDER } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';

const BUILDING_TYPE_SET: ReadonlySet<string> = new Set(BUILD_ORDER);

// Is this card key a building card (a BUILD_ORDER member)?
export function isBuildingType(value: string): value is BuildingType {
  return BUILDING_TYPE_SET.has(value);
}
