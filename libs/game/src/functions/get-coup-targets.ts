import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { getOwnedPlanets } from './get-owned-planets';
import { isPacifist } from './is-pacifist';
import { isUnderTruce } from './is-under-truce';

export const getCoupTargets = (state: GameState, player: Player): Planet[] => {
  const canTakeLast = isPacifist(player);
  return state.planets.filter(
    (planet) =>
      planet.ownerId !== player.id &&
      state.players[planet.ownerId].isAlive &&
      !isUnderTruce(planet) &&
      (canTakeLast ||
        getOwnedPlanets(state, state.players[planet.ownerId]).length > 1),
  );
};
