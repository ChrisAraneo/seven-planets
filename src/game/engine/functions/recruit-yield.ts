import type { Planet } from '@/game/types';

// Recruiting costs 1 Ore PER TROOP (no energy) — yield depends on Barracks level.
export function recruitYield(planet: Planet): number {
  const lvl = planet.buildings.BARRACKS || 0;
  return lvl >= 3 ? 4 : lvl; // L1=1, L2=2, L3=4
}
