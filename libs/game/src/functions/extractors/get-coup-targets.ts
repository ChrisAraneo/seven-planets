import type { GameState } from '../../interfaces/game-state';
import type { Planet } from '../../interfaces/planet';
import type { Player } from '../../interfaces/player';
import { chain } from '../../utils/chain';
import { isPacifist } from '../is-pacifist';
import { isUnderTruce } from '../is-under-truce';
import { getOwnedPlanets } from './get-owned-planets';

// TODO: OK 1/2 - utworzyć i użyć helper funkcji
export const getCoupTargets = (state: GameState, player: Player): Planet[] =>
  chain(isPacifist(player))
    .thru((canTakeLast) =>
      state.planets.filter(
        (planet) =>
          planet.ownerId !== player.id &&
          state.players[planet.ownerId].isAlive &&
          !isUnderTruce(planet) &&
          (canTakeLast ||
            getOwnedPlanets(state, state.players[planet.ownerId]).length > 1),
      ),
    )
    .value();
