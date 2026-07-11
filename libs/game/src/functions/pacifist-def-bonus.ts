import { PACIFIST_DEF_BONUS } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';

// Extra flat defense every pacifist owner's planet enjoys.
export function pacifistDefBonus(state: GameState, planet: Planet): number {
  return state.players[planet.ownerId]?.hasPacifistStatus
    ? PACIFIST_DEF_BONUS
    : 0;
}
