import { SILO_HIT_BONUS } from '@/game/constants';
import type { Planet } from '@/game/types';

export function siloBonus(planet: Planet): number {
  return SILO_HIT_BONUS * (planet.buildings.SILO || 0);
}
