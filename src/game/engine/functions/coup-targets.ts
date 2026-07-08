import type { Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { isPacifist } from './is-pacifist';
import { underTruce } from './under-truce';

// Can this planet be seized by a 👑 Coup played by `p`? A truce protects it, and a
// Rival's LAST planet is coup-proof — unless the couper has earned Pacifist status.
export function coupTargets(p: Player): Planet[] {
  const state = getGameState();
  const mayTakeLast = isPacifist(p);
  return state.planets.filter(
    (pl) =>
      pl.ownerId !== p.id &&
      state.players[pl.ownerId].alive &&
      !underTruce(pl) &&
      (mayTakeLast || state.players[pl.ownerId].planets.length > 1),
  );
}
