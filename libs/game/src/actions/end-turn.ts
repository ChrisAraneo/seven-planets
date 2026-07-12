import { chain, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { getHumanResolve, setHumanResolve } from '../functions/resolver-state';
import { getGameState, setGameState } from '../game-state';

export interface EndTurnPayload {
  playerId: number;
}

export function endTurn(payload: EndTurnPayload): void {
  return match({
    state: cloneDeep(getGameState()),
    humanResolve: getHumanResolve(),
  })
    .when(({ state }) => payload.playerId !== state.activeId, noop)
    .when(({ humanResolve }) => !humanResolve, noop)
    .otherwise(
      ({ state, humanResolve }) =>
        void chain(state)
          .tap(() => setHumanResolve(null))
          .thru((state) => Object.assign(state, { awaitingAction: false }))
          .tap(() => humanResolve?.())
          .tap((state) => setGameState(state))
          .value(),
    );
}
