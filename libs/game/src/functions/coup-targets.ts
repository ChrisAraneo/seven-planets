import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

import { isPacifist } from './is-pacifist';
import { isUnderTruce } from './is-under-truce';

// Can this planet be seized by a 👑 Coup played by `p`? A truce protects it, and a
// Rival's LAST planet is coup-proof — unless the couper has earned Pacifist status.
export function coupTargets(state: GameState, player: Player): Planet[] {
  const mayTakeLast = isPacifist(player);
  return state.planets.filter(
    (pl) =>
      pl.ownerId !== player.id &&
      state.players[pl.ownerId].alive &&
      !isUnderTruce(pl) &&
      (mayTakeLast || state.players[pl.ownerId].planets.length > 1),
  );
}
