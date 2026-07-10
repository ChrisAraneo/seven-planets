import { maxLevel } from '@/game/config/constants';
import { isSingularityLabOk } from '@/game/functions/is-singularity-lab-ok';
import type { Player } from '@/game/types';

import { owned } from './owned';
import { techLevel } from './tech-level';

export function isSingularityReadyFor(r: Player): boolean {
  const cap = Math.min(maxLevel('SINGULARITY'), techLevel(r));
  return owned(r).some((pl) => {
    const next = (pl.buildings.SINGULARITY || 0) + 1;
    return next <= cap && isSingularityLabOk(pl, next);
  });
}
