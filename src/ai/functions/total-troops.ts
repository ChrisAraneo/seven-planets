import type { Player } from '@/game/types';

import { owned } from './owned';

export function totalTroops(p: Player): number {
  return owned(p).reduce((sum, pl) => sum + pl.troops, 0);
}
