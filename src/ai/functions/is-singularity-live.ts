import {
  ADVANCED_FROM_TURN,
  BUILD_ORDER,
  maxLevel,
} from '@/game/config/constants';
import { isSingularityLabOk } from '@/game/functions/is-singularity-lab-ok';

import { alive } from './alive';
import { owned } from './owned';
import { techLevel } from './tech-level';

export function isSingularityLive(): boolean {
  return alive().some((p) =>
    owned(p).some((pl) => {
      const next = (pl.buildings.SINGULARITY || 0) + 1;
      return (
        next <= maxLevel('SINGULARITY') &&
        next <= techLevel(p) &&
        isSingularityLabOk(pl, next)
      );
    }),
  );
}
