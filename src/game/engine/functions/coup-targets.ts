import type { Planet, Player } from '@/game/types';
import { getState } from '../state';
import { isPacifist } from './is-pacifist';
import { persOf } from './pers-of';
import { underTruce } from './under-truce';

// Can this planet be seized by a 👑 Coup played by `p`? A truce protects it, and a
// Rival's LAST planet is coup-proof — you may not ELIMINATE a player with an
// Influence card — UNLESS the couper is a Pacifist, for whom a Coup is the only
// Road to conquest (and thus the only way to finish off the final rival).
export function coupTargets(p: Player): Planet[] {
  const mayTakeLast = isPacifist(p) || persOf(p) === 'pacifist';
  return getState().planets.filter(
    (pl) =>
      pl.ownerId !== p.id &&
      getState().players[pl.ownerId].alive &&
      !underTruce(pl) &&
      (mayTakeLast || getState().players[pl.ownerId].planets.length > 1),
  );
}
