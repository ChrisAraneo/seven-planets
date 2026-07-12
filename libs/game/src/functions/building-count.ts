import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';

export function buildingCount(state: GameState, player: Player): number {
  return ownedPlanets(state, player).reduce(
    (sum, planet) =>
      sum +
      Object.values(planet.buildings).reduce(
        (first, building) => first + building,
        0,
      ),
    0,
  );
}
