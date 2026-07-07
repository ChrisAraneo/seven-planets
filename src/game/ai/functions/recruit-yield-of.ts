import type { Planet } from '@/game/types';

export function recruitYieldOf(pl: Planet): number {
  const lvl = pl.buildings.BARRACKS || 0;
  return lvl >= 3 ? 4 : lvl;
}
