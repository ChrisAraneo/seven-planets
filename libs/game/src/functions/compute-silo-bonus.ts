import { SILO_HIT_BONUS } from '../config/constants';
import type { Planet } from '../interfaces/planet';

export const computeSiloBonus = (planet: Planet): number =>
  SILO_HIT_BONUS * (planet.buildings.SILO || 0);
