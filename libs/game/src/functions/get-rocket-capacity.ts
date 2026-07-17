import { BASE_ROCKET_CAP } from '../config/constants';
import type { Planet } from '../interfaces/planet';

const UNLIMITED_SILO_LEVEL = 3;

export const getRocketCapacity = (planet: Planet): number =>
  ((planet.buildings.SILO || 0) >= UNLIMITED_SILO_LEVEL && Infinity) ||
  BASE_ROCKET_CAP * 2 ** (planet.buildings.SILO || 0);
