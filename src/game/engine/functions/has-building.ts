import type { BuildingType, Player } from '@/game/types';
import { ownedPlanets } from './owned-planets';

export function hasBuilding(p: Player, id: BuildingType): boolean {
  return ownedPlanets(p).some((pl) => pl.buildings[id]);
}
