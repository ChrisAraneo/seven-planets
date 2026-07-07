import type { GameState, Player } from '@/game/types';
import { isFullyBuilt } from '@/game/shared/is-fully-built';
import { owned } from './owned';

export function techLevel(s: GameState, p: Player): number {
  if (owned(s, p).some(isFullyBuilt)) {
    return 4;
  }
  const sings = owned(s, p).filter((pl) => pl.buildings.SINGULARITY).length;
  return sings >= 2 ? 3 : sings >= 1 ? 2 : 1;
}
