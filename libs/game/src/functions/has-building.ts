import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';

export function hasBuilding(
  state: GameState,
  p: Player,
  id: BuildingType,
): boolean {
  return ownedPlanets(state, p).some((pl) => pl.buildings[id]);
}
