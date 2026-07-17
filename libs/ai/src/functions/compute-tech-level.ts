import type { Player } from '@seven-planets/game';
import { isFullyBuilt } from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';

export function computeTechLevel(player: Player): number {
  if (getOwnedPlanets(player).some((planet) => isFullyBuilt(planet))) {
    return 4;
  }
  const singularityCount = getOwnedPlanets(player).filter(
    (planet) => planet.buildings.SINGULARITY,
  ).length;
  return singularityCount >= 2 ? 3 : singularityCount >= 1 ? 2 : 1;
}
