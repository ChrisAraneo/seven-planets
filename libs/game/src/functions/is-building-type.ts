import { BUILD_ORDER } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';

const BUILDING_TYPE_SET: ReadonlySet<string> = new Set(BUILD_ORDER);

export const isBuildingType = (value: string): value is BuildingType =>
  BUILDING_TYPE_SET.has(value);
