import type { Player } from '@seven-planets/game';

import { owned } from './owned';

export function computeTotalTroops(player: Player): number {
  return owned(player).reduce((sum, planet) => sum + planet.troops, 0);
}
