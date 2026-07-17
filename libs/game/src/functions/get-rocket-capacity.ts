import { BASE_ROCKET_CAP } from '../config/constants';
import type { Planet } from '../interfaces/planet';

const UNLIMITED_SILO_LEVEL = 3;

export function getRocketCapacity(planet: Planet): number {
  return (
    ((planet.buildings.SILO || 0) >= UNLIMITED_SILO_LEVEL && Infinity) ||
    BASE_ROCKET_CAP * 2 ** (planet.buildings.SILO || 0)
  );
}
