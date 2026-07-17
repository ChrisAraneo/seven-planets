import type { Planet } from '../interfaces/planet';

const BARRACKS_YIELD_CAP_LEVEL = 3;

export function computeRecruitYield(planet: Planet): number {
  return (
    Math.min(planet.buildings.BARRACKS || 0, BARRACKS_YIELD_CAP_LEVEL) +
    Number((planet.buildings.BARRACKS || 0) >= BARRACKS_YIELD_CAP_LEVEL)
  );
}
