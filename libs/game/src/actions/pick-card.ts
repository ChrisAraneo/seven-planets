import { assign, chain, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { canPickCard } from '../functions/can-pick-card';
import { homePlanet } from '../functions/home-planet';
import { getPoolResolve, setPoolResolve } from '../functions/resolver-state';
import { getGameState, setGameState } from '../game-state';
import type { GameState } from '../interfaces/game-state';

export interface PickCardPayload {
  playerId: number;
  idx: number;
}

export async function pickCard(payload: PickCardPayload): Promise<void> {
  return match({ state: cloneDeep(getGameState()), resolve: getPoolResolve() })
    .when(
      ({ state, resolve }) =>
        !resolve ||
        state.phase !== 'draft' ||
        payload.playerId !== state.activeId,
      noop,
    )
    .when(({ state }) => !isValidPick(state, payload), noop)
    .otherwise(
      ({ state, resolve }) =>
        void chain(state)
          .tap(() => setPoolResolve(null))
          .thru((state) => assign(state, { awaitingPick: false }))
          .tap(() => resolve?.(payload.idx))
          .tap((state) => setGameState(state))
          .value(),
    );
}

function isValidPick(
  state: GameState,
  { playerId, idx: index }: PickCardPayload,
): boolean {
  return chain(state.players[playerId])
    .thru((player) => ({
      p: player,
      planet: state.planets[state.draftPlanetId] || homePlanet(state, player),
    }))
    .thru(
      ({ p: player, planet }) =>
        index >= 0 &&
        index < state.pool.length &&
        canPickCard(state, player, state.pool[index], planet),
    )
    .value();
}
