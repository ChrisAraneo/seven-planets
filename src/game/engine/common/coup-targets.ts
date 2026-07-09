import { getGameState } from '@/stores/game-state';
import type { Planet, Player } from '@/game/types';

import { isPacifist } from './is-pacifist';
import { isUnderTruce } from './is-under-truce';

// Can this planet be seized by a 👑 Coup played by `p`? A truce protects it, and a
// Rival's LAST planet is coup-proof — unless the couper has earned Pacifist status.
export function coupTargets(p: Player): Planet[] {
  const mayTakeLast = isPacifist(p);
  return getGameState().planets.filter(
    (pl) =>
      pl.ownerId !== p.id &&
      getGameState().players[pl.ownerId].alive &&
      !isUnderTruce(pl) &&
      (mayTakeLast || getGameState().players[pl.ownerId].planets.length > 1),
  );
}
