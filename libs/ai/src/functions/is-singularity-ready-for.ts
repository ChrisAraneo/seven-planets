import type { Player } from '@seven-planets/game';
import { getMaxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';

import { computeTechLevel } from './compute-tech-level';
import { getOwnedPlanets } from './get-owned-planets';

export function isSingularityReadyFor(player: Player): boolean {
  const cap = Math.min(getMaxLevel('SINGULARITY'), computeTechLevel(player));
  return getOwnedPlanets(player).some((planet) => {
    const nextLevel = (planet.buildings.SINGULARITY || 0) + 1;
    return nextLevel <= cap && isSingularityLabOk(planet, nextLevel);
  });
}
