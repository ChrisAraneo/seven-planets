import { maxLevel } from '@seven-planets/game';
import { isSingularityLabOk } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { owned } from './owned';
import { techLevel } from './tech-level';

export function isSingularityReadyFor(r: Player): boolean {
  const cap = Math.min(maxLevel('SINGULARITY'), techLevel(r));
  return owned(r).some((pl) => {
    const next = (pl.buildings.SINGULARITY || 0) + 1;
    return next <= cap && isSingularityLabOk(pl, next);
  });
}
