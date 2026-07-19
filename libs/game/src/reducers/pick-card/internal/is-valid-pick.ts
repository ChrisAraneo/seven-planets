import type { PickCardPayload } from '../../../actions/pick-card';
import { canPickCard } from '../../../functions/can-pick-card';
import { getFirstOwnedPlanet } from '../../../functions/extractors/get-first-owned-planet';
import type { GameState } from '../../../interfaces/game-state';
import { chain } from '../../../utils/chain';

export const isValidPick = (
  state: GameState,
  { playerId, index }: PickCardPayload,
): boolean =>
  chain(state.players[playerId])
    .thru((player) => ({
      player,
      planet:
        state.planets[state.draftPlanetId] ||
        getFirstOwnedPlanet(state, player),
    }))
    .thru(
      ({ player, planet }) =>
        index >= 0 &&
        index < state.pool.length &&
        canPickCard(state, player, state.pool[index], planet),
    )
    .value();
