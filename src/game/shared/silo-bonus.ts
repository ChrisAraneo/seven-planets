import { SILO_HIT_BONUS } from '@/game/constants';
import type { Planet } from '@/game/types';

export function siloBonus(pl: Planet): number {
  return SILO_HIT_BONUS * (pl.buildings.SILO || 0);
}
