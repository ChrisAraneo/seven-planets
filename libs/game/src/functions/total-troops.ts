import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';

export function totalTroops(state: GameState, p: Player): number {
  return ownedPlanets(state, p).reduce((s, pl) => s + pl.troops, 0);
}
