import { ADVANCED_FROM_TURN, BUILD_ORDER, maxLevel } from '@/game/constants';
import type { GameState } from '@/game/types';
import { alive } from './alive';
import { owned } from './owned';
import { singularityLabOk } from './singularity-lab-ok';
import { techLevel } from './tech-level';

export function singularityLive(s: GameState): boolean {
  return alive(s).some((p) =>
    owned(s, p).some((pl) => {
      const next = (pl.buildings.SINGULARITY || 0) + 1;
      return (
        next <= maxLevel('SINGULARITY') &&
        next <= techLevel(s, p) &&
        singularityLabOk(pl, next)
      );
    }),
  );
}
