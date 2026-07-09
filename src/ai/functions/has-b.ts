import type { BuildingType, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { owned } from './owned';

export function hasB(p: Player, id: BuildingType): boolean {
  const s = getGameState();
  return owned(p).some((pl) => pl.buildings[id]);
}
