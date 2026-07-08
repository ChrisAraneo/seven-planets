import { PACIFIST_DEF_BONUS } from '@/game/constants';
import type { Planet } from '@/game/types';
import { getGameState } from '@/stores/game-state';

// Extra flat defense every pacifist owner's planet enjoys.
export function pacifistDefBonus(planet: Planet): number {
  const state = getGameState();
  return state.players[planet.ownerId]?.pacifistStatus ? PACIFIST_DEF_BONUS : 0;
}
