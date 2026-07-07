import { PACIFIST_INFLUENCE } from '@/game/constants';
import type { GameState, Player } from '@/game/types';
import { hasB } from './has-b';
import { owned } from './owned';

export function influenceIncome(s: GameState, p: Player): number {
  let inc = 0;
  for (const pl of owned(s, p)) {
    if ((pl.buildings.EMBASSY || 0) >= 2) {
      inc += 1;
    }
    if (p.pacifistStatus) {
      inc += PACIFIST_INFLUENCE;
    }
  }
  if (hasB(s, p, 'EMBASSY')) {
    inc += 0.25;
  }
  return inc;
}
