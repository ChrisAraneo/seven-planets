import type { Player } from '@seven-planets/game';

import { owned } from './owned';

export function totalTroops(player: Player): number {
  return owned(player).reduce((sum, planet) => sum + planet.troops, 0);
}
