import type { Planet } from '@/game/types';

// Recruiting costs 1 Ore PER TROOP — yield depends on Barracks level.
// L1=1 troop, L2=2 troops, L3=4 troops.
export function recruitYield(pl: Planet): number {
  const lvl = pl.buildings.BARRACKS || 0;
  return lvl >= 3 ? 4 : lvl;
}
