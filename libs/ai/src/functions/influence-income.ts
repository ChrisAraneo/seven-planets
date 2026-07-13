import { PACIFIST_INFLUENCE } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { hasB } from './has-b';
import { owned } from './owned';

export function influenceIncome(player: Player): number {
  let inc = 0;
  for (const planet of owned(player)) {
    if ((planet.buildings.EMBASSY || 0) >= 2) {
      inc += 1;
    }
    if (player.hasPacifistStatus) {
      inc += PACIFIST_INFLUENCE;
    }
  }
  if (hasB(player, 'EMBASSY')) {
    inc += 0.25;
  }
  return inc;
}
