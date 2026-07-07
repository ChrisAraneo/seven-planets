import type { Planet, Player } from '@/game/types';
import { getState } from '../state';
import { isPacifist } from './is-pacifist';
import { underTruce } from './under-truce';

// Can this planet be seized by a 👑 Coup played by `p`? A truce protects it, and a
// rival's LAST planet is coup-proof — unless the couper has earned Pacifist status.
export function coupTargets(p: Player): Planet[] {
  const mayTakeLast = isPacifist(p);
  return getState().planets.filter(
    (pl) =>
      pl.ownerId !== p.id &&
      getState().players[pl.ownerId].alive &&
      !underTruce(pl) &&
      (mayTakeLast || getState().players[pl.ownerId].planets.length > 1),
  );
}
