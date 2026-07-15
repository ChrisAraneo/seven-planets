import { SHIELD_DEFENSE, SHIELD_UNPOWERED_DEFENSE } from '../config/constants';
import type { Planet } from '../interfaces/planet';

// The shield's defense contribution: 0/+4/+8/+16 by level. An L3 shield that
// missed its 💎 upkeep this turn (shieldUnpowered) falls back to +8.
// Branch-free-ish arithmetic: this sits in the AI's planning hot loop.
export function computeShieldDefense(planet: Planet): number {
  return Math.min(
    SHIELD_DEFENSE[planet.buildings.SHIELD || 0],
    (planet.shieldUnpowered && SHIELD_UNPOWERED_DEFENSE) || Infinity,
  );
}
