import { BUILD_ORDER, BUILDINGS, CARDS, incomeAmount } from '@/game/constants';
import type { Planet } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function planetValue(pl: Planet): number {
  const s = getGameState();
  let v = 6;
  for (const b of BUILD_ORDER) {
    const lvl = pl.buildings[b] || 0;
    if (!lvl) {
      continue;
    }
    v += lvl * 1.5;
    const inc = BUILDINGS[b].income;
    if (inc) {
      v += incomeAmount(b, lvl) * CARDS[inc].value * 3;
    }
  }
  v += (pl.buildings.SINGULARITY || 0) * 4 + (pl.buildings.LAB ? 2 : 0);
  return v;
}
