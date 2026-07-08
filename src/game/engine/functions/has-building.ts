import type { BuildingType, GameState, Player } from '@/game/types';
import { ownedPlanets } from './owned-planets';

export function hasBuilding(
  state: GameState,
  p: Player,
  id: BuildingType,
): boolean {
  return ownedPlanets(state, p).some((pl) => pl.buildings[id]);
}
