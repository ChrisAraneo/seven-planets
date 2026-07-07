import { maxLevel } from '@/game/constants';
import type { GameState, Player } from '@/game/types';
import { owned } from './owned';
import { isSingularityLabOk } from '@/game/shared/is-singularity-lab-ok';
import { techLevel } from './tech-level';

export function singularityReadyFor(s: GameState, r: Player): boolean {
  const cap = Math.min(maxLevel('SINGULARITY'), techLevel(s, r));
  return owned(s, r).some((pl) => {
    const next = (pl.buildings.SINGULARITY || 0) + 1;
    return next <= cap && isSingularityLabOk(pl, next);
  });
}
