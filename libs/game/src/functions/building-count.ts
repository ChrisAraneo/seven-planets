import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';

export function buildingCount(state: GameState, p: Player): number {
  return ownedPlanets(state, p).reduce(
    (s, pl) => s + Object.values(pl.buildings).reduce((a, b) => a + b, 0),
    0,
  );
}
