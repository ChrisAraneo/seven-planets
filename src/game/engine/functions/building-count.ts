import type { GameState, Player } from '@/game/types';
import { ownedPlanets } from './owned-planets';

export function buildingCount(state: GameState, p: Player): number {
  return ownedPlanets(state, p).reduce(
    (s, pl) => s + Object.values(pl.buildings).reduce((a, b) => a + b, 0),
    0,
  );
}
