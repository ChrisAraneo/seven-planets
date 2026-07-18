import type { Planet } from '../interfaces/planet';
import { getBuildingLevel } from './extractors/get-building-level';

const BARRACKS_YIELD_CAP_LEVEL = 3;

export const computeRecruitYield = (planet: Planet): number =>
  Math.min(getBuildingLevel(planet, 'BARRACKS'), BARRACKS_YIELD_CAP_LEVEL) +
  Number(getBuildingLevel(planet, 'BARRACKS') >= BARRACKS_YIELD_CAP_LEVEL);
