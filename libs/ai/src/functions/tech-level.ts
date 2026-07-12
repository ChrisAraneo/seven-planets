import { isFullyBuilt } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

import { owned } from './owned';

export function techLevel(player: Player): number {
  if (owned(player).some(isFullyBuilt)) {
    return 4;
  }
  const sings = owned(player).filter(
    (planet) => planet.buildings.SINGULARITY,
  ).length;
  return sings >= 2 ? 3 : sings >= 1 ? 2 : 1;
}
