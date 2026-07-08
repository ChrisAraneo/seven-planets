import type { GameState, Planet, Player } from '@/game/types';
import { isPacifist } from './is-pacifist';
import { underTruce } from './under-truce';

// Can this planet be seized by a 👑 Coup played by `p`? A truce protects it, and a
// rival's LAST planet is coup-proof — unless the couper has earned Pacifist status.
export function coupTargets(state: GameState, p: Player): Planet[] {
  const mayTakeLast = isPacifist(p);
  return state.planets.filter(
    (pl) =>
      pl.ownerId !== p.id &&
      state.players[pl.ownerId].alive &&
      !underTruce(state, pl) &&
      (mayTakeLast || state.players[pl.ownerId].planets.length > 1),
  );
}
