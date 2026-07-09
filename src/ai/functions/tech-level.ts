import { isFullyBuilt } from '@/game/shared/is-fully-built';
import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { owned } from './owned';

export function techLevel(p: Player): number {
  const s = getGameState();
  if (owned(p).some(isFullyBuilt)) {
    return 4;
  }
  const sings = owned(p).filter((pl) => pl.buildings.SINGULARITY).length;
  return sings >= 2 ? 3 : sings >= 1 ? 2 : 1;
}
