import { getRocketCapacity } from '@seven-planets/game';
import { computeSiloBonus } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { getOwnedPlanets } from './get-owned-planets';
import { computeRecruitRate } from './compute-recruit-rate';

export function computeProjectedStrike(
  player: Player,
  turnsAhead: number,
  excludePlanetId = -1,
): { n: number; bonus: number } {
  let best = { n: 0, bonus: 0 };
  const growth = computeRecruitRate(player) * turnsAhead;
  for (const planet of getOwnedPlanets(player)) {
    if (planet.id === excludePlanetId || !planet.buildings.SILO) {
      continue;
    }
    const count = Math.min(
      getRocketCapacity(planet),
      Math.floor(planet.troops + growth) - 1,
    );
    if (count > best.n) {
      best = { n: count, bonus: computeSiloBonus(planet) };
    }
  }
  return best;
}
