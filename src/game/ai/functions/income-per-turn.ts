import { BUILD_ORDER, BUILDINGS, incomeAmount } from '@/game/constants';
import type { Cost, GameState, Player } from '@/game/types';
import { owned } from './owned';

export function incomePerTurn(s: GameState, p: Player): Cost {
  const inc: Cost = {};
  for (const pl of owned(s, p)) {
    for (const b of BUILD_ORDER) {
      const res = BUILDINGS[b].income;
      if (res && pl.buildings[b]) {
        inc[res] = (inc[res] || 0) + incomeAmount(b, pl.buildings[b]);
      }
    }
  }
  return inc;
}
