import type { Planet } from '../interfaces/planet';

const BASE_TECH = 1;
const MAX_SINGULARITY_TECH_BONUS = 2;
export const computeTechFromSingularities = (planets: Planet[]): number =>
  BASE_TECH +
  Math.min(
    planets.filter((planet) => planet.buildings.SINGULARITY).length,
    MAX_SINGULARITY_TECH_BONUS,
  );
