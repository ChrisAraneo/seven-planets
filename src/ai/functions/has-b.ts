import type { BuildingType, Player } from '@/game/types';

import { owned } from './owned';

export function hasB(p: Player, id: BuildingType): boolean {
  return owned(p).some((pl) => pl.buildings[id]);
}
