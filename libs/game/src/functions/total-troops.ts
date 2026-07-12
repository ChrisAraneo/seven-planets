import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';

export function totalTroops(state: GameState, player: Player): number {
  return ownedPlanets(state, player).reduce(
    (sum, planet) => sum + planet.troops,
    0,
  );
}
