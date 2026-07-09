import { ADVANCED_FROM_TURN, BUILD_ORDER, maxLevel } from '@/game/constants';
import { isSingularityLabOk } from '@/game/shared/is-singularity-lab-ok';
import { getGameState } from '@/stores/game-state';

import { alive } from './alive';
import { owned } from './owned';
import { techLevel } from './tech-level';

export function singularityLive(): boolean {
  const s = getGameState();
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
