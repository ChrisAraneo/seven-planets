import { SILO_HIT_BONUS } from '../config/constants';
import type { Planet } from '../interfaces/planet';
import { getBuildingLevel } from './get-building-level';

export const computeSiloBonus = (planet: Planet): number =>
  SILO_HIT_BONUS * getBuildingLevel(planet, 'SILO');
