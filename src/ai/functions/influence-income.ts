import { PACIFIST_INFLUENCE } from '@/game/constants';
import type { Player } from '@/game/types';

import { hasB } from './has-b';
import { owned } from './owned';

export function influenceIncome(p: Player): number {
  let inc = 0;
  for (const pl of owned(p)) {
    if ((pl.buildings.EMBASSY || 0) >= 2) {
      inc += 1;
    }
    if (p.pacifistStatus) {
      inc += PACIFIST_INFLUENCE;
    }
  }
  if (hasB(p, 'EMBASSY')) {
    inc += 0.25;
  }
  return inc;
}
