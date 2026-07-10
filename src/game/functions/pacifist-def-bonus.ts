import { PACIFIST_DEF_BONUS } from '@/game/config/constants';
import type { GameState, Planet } from '@/game/types';

// Extra flat defense every pacifist owner's planet enjoys.
export function pacifistDefBonus(state: GameState, planet: Planet): number {
  return state.players[planet.ownerId]?.pacifistStatus ? PACIFIST_DEF_BONUS : 0;
}
