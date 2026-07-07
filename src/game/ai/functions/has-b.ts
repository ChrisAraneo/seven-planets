import type { BuildingType, GameState, Player } from '@/game/types';
import { owned } from './owned';

export function hasB(s: GameState, p: Player, id: BuildingType): boolean {
  return owned(s, p).some((pl) => pl.buildings[id]);
}
