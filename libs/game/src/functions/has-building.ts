import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { getOwnedPlanets } from './get-owned-planets';

export function hasBuilding(
  state: GameState,
  player: Player,
  id: BuildingType,
): boolean {
  return getOwnedPlanets(state, player).some((planet) => planet.buildings[id]);
}
