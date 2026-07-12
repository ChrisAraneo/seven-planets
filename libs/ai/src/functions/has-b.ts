import type { BuildingType, Player } from '@seven-planets/game';

import { owned } from './owned';

export function hasB(player: Player, id: BuildingType): boolean {
  return owned(player).some((planet) => planet.buildings[id]);
}
