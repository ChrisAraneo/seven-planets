import { BUILD_ORDER, BUILDINGS, handValue } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { owned } from './owned';
import { totalTroops } from './total-troops';

export function playerStrength(p: Player): number {
  const resources = handValue(p.hand);
  const military = totalTroops(p) * 1.5;
  const territory = p.planets.length * 8;
  const income = owned(p).reduce(
    (sum, pl) =>
      sum +
      BUILD_ORDER.filter((b) => pl.buildings[b] && BUILDINGS[b].income).length *
        3,
    0,
  );
  return resources + military + territory + income;
}
