import { SILO_HIT_BONUS } from '../config/constants';
import type { Planet } from '../interfaces/planet';

export function siloBonus(pl: Planet): number {
  return SILO_HIT_BONUS * (pl.buildings.SILO || 0);
}
