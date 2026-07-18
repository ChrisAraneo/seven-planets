import { BASE_ROCKET_CAP } from '../config/constants';
import type { Planet } from '../interfaces/planet';
import { getBuildingLevel } from './get-building-level';

const UNLIMITED_SILO_LEVEL = 3;
const SILO_CAP_FACTOR = 2;

export const getRocketCapacity = (planet: Planet): number =>
  (getBuildingLevel(planet, 'SILO') >= UNLIMITED_SILO_LEVEL && Infinity) ||
  BASE_ROCKET_CAP * SILO_CAP_FACTOR ** getBuildingLevel(planet, 'SILO');
