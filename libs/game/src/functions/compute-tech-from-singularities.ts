import type { Planet } from '../interfaces/planet';

export const computeTechFromSingularities = (planets: Planet[]): number =>
  1 +
  Math.min(planets.filter((planet) => planet.buildings.SINGULARITY).length, 2);
