import type { Player } from '@seven-planets/game';

import { owned } from './owned';

export function totalTroops(p: Player): number {
  return owned(p).reduce((sum, pl) => sum + pl.troops, 0);
}
