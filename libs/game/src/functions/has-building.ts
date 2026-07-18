import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { getOwnedPlanets } from './extractors/get-owned-planets';

export const hasBuilding = (
  state: GameState,
  player: Player,
  id: BuildingType,
): boolean =>
  getOwnedPlanets(state, player).some((planet) => planet.buildings[id]);
