import { rocketCap } from '@seven-planets/game';
import { siloBonus } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { owned } from './owned';
import { recruitRate } from './recruit-rate';

export function projectedStrike(
  player: Player,
  turnsAhead: number,
  excludePlanetId = -1,
): { n: number; bonus: number } {
  let best = { n: 0, bonus: 0 };
  const growth = recruitRate(player) * turnsAhead;
  for (const planet of owned(player)) {
    if (planet.id === excludePlanetId || !planet.buildings.SILO) {
      continue;
    }
    const count = Math.min(
      rocketCap(planet),
      Math.floor(planet.troops + growth) - 1,
    );
    if (count > best.n) {
      best = { n: count, bonus: siloBonus(planet) };
    }
  }
  return best;
}
