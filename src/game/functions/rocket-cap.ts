import { BASE_ROCKET_CAP } from '@/game/config/constants';
import type { Planet } from '@/game/types';

// Rockets launch from a specific planet: every silo level MULTIPLIES capacity by 2.
// L3: unlimited — all troops can board.
export function rocketCap(pl: Planet): number {
  const lvl = pl.buildings.SILO || 0;
  return lvl >= 3 ? Infinity : BASE_ROCKET_CAP * 2 ** lvl;
}
