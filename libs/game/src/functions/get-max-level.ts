import type { BuildingType } from '../interfaces/building-type';

const DEFAULT_MAX_LEVEL = 3;
const BUILDING_MAX_LEVEL: Partial<Record<BuildingType, number>> = {
  MINE: 2,
  EXTRACTOR: 2,
  SOLAR: 2,
  HARVESTER: 2,
  SPACEPORT: 2,
  EMBASSY: 2,
  SINGULARITY: 4,
};
export const getMaxLevel = (id: BuildingType): number =>
  BUILDING_MAX_LEVEL[id] || DEFAULT_MAX_LEVEL;
