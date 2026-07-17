import { SHIELD_DEFENSE, SHIELD_UNPOWERED_DEFENSE } from '../config/constants';
import type { Planet } from '../interfaces/planet';

export function computeShieldDefense(planet: Planet): number {
  return Math.min(
    SHIELD_DEFENSE[planet.buildings.SHIELD || 0],
    planet.isShieldUnpowered ? SHIELD_UNPOWERED_DEFENSE : Infinity,
  );
}
