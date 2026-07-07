import { BASE_ROCKET_CAP } from '@/game/constants';
import type { Planet } from '@/game/types';

// Rockets launch from a specific planet: every silo level MULTIPLIES capacity by 2.
export function rocketCap(planet: Planet): number {
  const lvl = planet.buildings.SILO || 0;
  if (lvl >= 3) {
    return Infinity;
  } // L3: unlimited — all troops can board
  return BASE_ROCKET_CAP * 2 ** lvl; // 3 → 6 → 12
}
