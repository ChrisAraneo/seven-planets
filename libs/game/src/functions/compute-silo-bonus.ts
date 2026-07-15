import { SILO_HIT_BONUS } from '../config/constants';
import type { Planet } from '../interfaces/planet';

export function computeSiloBonus(planet: Planet): number {
  return SILO_HIT_BONUS * (planet.buildings.SILO || 0);
}
