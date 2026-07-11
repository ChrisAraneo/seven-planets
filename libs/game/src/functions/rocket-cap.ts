import { BASE_ROCKET_CAP } from '../config/constants';
import type { Planet } from '../interfaces/planet';

// Rockets launch from a specific planet: every silo level MULTIPLIES capacity by 2.
// L3: unlimited — all troops can board. Short-circuit expression (the doubled
// cap is always truthy): this sits in the AI's planning hot loop.
export function rocketCap(pl: Planet): number {
  return (
    ((pl.buildings.SILO || 0) >= 3 && Infinity) ||
    BASE_ROCKET_CAP * 2 ** (pl.buildings.SILO || 0)
  );
}
