import { getGameState } from '@/stores/game-state';
import { PACIFIST_DEF_BONUS } from '@/game/constants';
import type { Planet } from '@/game/types';

// Extra flat defense every pacifist owner's planet enjoys.
export function pacifistDefBonus(planet: Planet): number {
  return getGameState().players[planet.ownerId]?.pacifistStatus
    ? PACIFIST_DEF_BONUS
    : 0;
}
