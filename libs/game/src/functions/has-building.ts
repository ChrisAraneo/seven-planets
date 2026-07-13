import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';

export function hasBuilding(
  state: GameState,
  player: Player,
  id: BuildingType,
): boolean {
  return ownedPlanets(state, player).some((planet) => planet.buildings[id]);
}
