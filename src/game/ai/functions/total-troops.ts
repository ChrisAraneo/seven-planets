import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { owned } from './owned';

export function totalTroops(p: Player): number {
  const s = getGameState();
  return owned(p).reduce((sum, pl) => sum + pl.troops, 0);
}
