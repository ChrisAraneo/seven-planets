import { SHIELD_DEFENSE, SHIELD_UNPOWERED_DEFENSE } from '../config/constants';
import type { Planet } from '../interfaces/planet';

// The shield's defense contribution: 0/+4/+8/+16 by level. An L3 shield that
// Missed its 💎 upkeep this turn (isShieldUnpowered) falls back to +8.
// This sits in the AI's planning hot loop.
export function computeShieldDefense(planet: Planet): number {
  return Math.min(
    SHIELD_DEFENSE[planet.buildings.SHIELD || 0],
    planet.isShieldUnpowered ? SHIELD_UNPOWERED_DEFENSE : Infinity,
  );
}
