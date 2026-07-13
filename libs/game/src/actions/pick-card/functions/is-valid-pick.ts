import { chain } from 'lodash-es';
import type { GameState } from '../../../interfaces/game-state';
import type { PickCardPayload } from '../pick-card';
import { homePlanet } from '../../../functions/home-planet';
import { canPickCard } from '../../../functions/can-pick-card';

export function isValidPick(
  state: GameState,
  { playerId, idx: index }: PickCardPayload,
): boolean {
  return chain(state.players[playerId])
    .thru((player) => ({
      player,
      planet: state.planets[state.draftPlanetId] || homePlanet(state, player),
    }))
    .thru(
      ({ player, planet }) =>
        index >= 0 &&
        index < state.pool.length &&
        canPickCard(state, player, state.pool[index], planet),
    )
    .value();
}
