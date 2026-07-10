import { isFullyBuilt } from '@/game/functions/is-fully-built';
import type { Player } from '@/game/types';

import { owned } from './owned';

export function techLevel(p: Player): number {
  if (owned(p).some(isFullyBuilt)) {
    return 4;
  }
  const sings = owned(p).filter((pl) => pl.buildings.SINGULARITY).length;
  return sings >= 2 ? 3 : sings >= 1 ? 2 : 1;
}
