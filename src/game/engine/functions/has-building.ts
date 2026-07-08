import type { BuildingType, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { ownedPlanets } from './owned-planets';

export function hasBuilding(p: Player, id: BuildingType): boolean {
  const state = getGameState();
  return ownedPlanets(p).some((pl) => pl.buildings[id]);
}
