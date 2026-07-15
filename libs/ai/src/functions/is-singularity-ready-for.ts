import { getMaxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { owned } from './owned';
import { techLevel } from './tech-level';

export function isSingularityReadyFor(player: Player): boolean {
  const cap = Math.min(getMaxLevel('SINGULARITY'), techLevel(player));
  return owned(player).some((planet) => {
    const next = (planet.buildings.SINGULARITY || 0) + 1;
    return next <= cap && isSingularityLabOk(planet, next);
  });
}
