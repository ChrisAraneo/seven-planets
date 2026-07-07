import { PACIFIST_DEF_BONUS } from '@/game/constants';
import type { Planet } from '@/game/types';
import { getState } from '../state';

// Extra flat defense every pacifist owner's planet enjoys.
export function pacifistDefBonus(planet: Planet): number {
  return getState().players[planet.ownerId]?.pacifistStatus
    ? PACIFIST_DEF_BONUS
    : 0;
}
