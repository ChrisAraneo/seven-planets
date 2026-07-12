import { assign, chain, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { canPickCard } from '../functions/can-pick-card';
import { homePlanet } from '../functions/home-planet';
import { resumeEngine } from '../functions/engine-driver';
import { getGameState, setGameState } from '../game-state';
import type { GameState } from '../interfaces/game-state';

export interface PickCardPayload {
  playerId: number;
  idx: number;
}

// A pool pick is only accepted while the engine is suspended awaiting it
// (`awaitingPick`) for the seat in play. Clearing the flag and resuming the
// engine with the chosen index is the whole answer — no callback involved.
export function pickCard(payload: PickCardPayload): void {
  return match(cloneDeep(getGameState()))
    .when(
      (state) =>
        !state.awaitingPick ||
        state.phase !== 'draft' ||
        payload.playerId !== state.activeId,
      noop,
    )
    .when((state) => !isValidPick(state, payload), noop)
    .otherwise(
      (state) =>
        void chain(state)
          .thru((state) => assign(state, { awaitingPick: false }))
          .tap((state) => setGameState(state))
          .tap(() => resumeEngine(payload.idx))
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
