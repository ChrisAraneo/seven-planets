import type { PickCardPayload } from '../../actions/pick-card/pick-card';
import { canPickCard } from '../../functions/can-pick-card';
import { getHomePlanet } from '../../functions/get-home-planet';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';

export const isValidPick = (
  state: GameState,
  { playerId, index }: PickCardPayload,
): boolean =>
  chain(state.players[playerId])
    .thru((player) => ({
      player,
      planet:
        state.planets[state.draftPlanetId] || getHomePlanet(state, player),
    }))
    .thru(
      ({ player, planet }) =>
        index >= 0 &&
        index < state.pool.length &&
        canPickCard(state, player, state.pool[index], planet),
    )
    .value();
