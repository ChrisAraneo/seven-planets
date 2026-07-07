import { BASE_ROCKET_CAP } from '@/game/constants';
import type { Planet } from '@/game/types';

export function rocketCap(pl: Planet): number {
  const lvl = pl.buildings.SILO || 0;
  return lvl >= 3 ? Infinity : BASE_ROCKET_CAP * 2 ** lvl;
}
