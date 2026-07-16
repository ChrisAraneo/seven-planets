import { getMaxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';
import { computeTechLevel } from './compute-tech-level';

export function isSingularityReadyFor(player: Player): boolean {
  const cap = Math.min(getMaxLevel('SINGULARITY'), computeTechLevel(player));
  return getOwnedPlanets(player).some((planet) => {
    const nextLevel = (planet.buildings.SINGULARITY || 0) + 1;
    return nextLevel <= cap && isSingularityLabOk(planet, nextLevel);
  });
}
