import { assign, chain, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { resumeEngine } from '../../functions/engine-driver';
import { getGameState, setGameState } from '../../game-state';

export interface EndTurnPayload {
  playerId: number;
}

// An action turn ends only while the engine is suspended awaiting it
// (`awaitingAction`) for the seat in play. Clearing the flag and resuming
// the engine advances it to the next seat — the flag is the whole signal.
export function endTurn(payload: EndTurnPayload): void {
  return match(cloneDeep(getGameState()))
    .when((state) => payload.playerId !== state.activeId, noop)
    .when((state) => !state.awaitingAction, noop)
    .otherwise(
      (state) =>
        void chain(state)
          .thru((state) => assign(state, { awaitingAction: false }))
          .tap((state) => setGameState(state))
          .tap(() => resumeEngine(undefined))
          .value(),
    );
}
