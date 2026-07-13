import { assign, chain, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';
import type { GameState } from '../../interfaces/game-state';
import { dispatch } from '../../state';

export interface EndTurnPayload {
  playerId: number;
}

/** End the seat in play's action turn. Event creator: validation and
    application live in the reducer (applyEndTurn). */
export function endTurn(payload: EndTurnPayload): void {
  dispatch({ kind: 'endTurn', ...payload });
}

/* Reducer branch. Consumes the parked action turn and steps the cursor to
   the next seat — advance resumes from there. Allowed after game over (the
   AI always ends its turn; settling to 'done' rides on it). */
export function applyEndTurn(
  state: GameState,
  payload: EndTurnPayload,
): GameState {
  return match(state)
    .when(
      (state) => payload.playerId !== state.activeId || !state.awaitingAction,
      (state) => state,
    )
    .otherwise((state) =>
      chain(cloneDeep(state))
        .tap((clone) => assign(clone, { awaitingAction: false }))
        .tap((clone) =>
          match(clone.cursor)
            .with({ phase: 'action' }, (cursor) =>
              assign(clone, {
                cursor: { ...cursor, seatIdx: cursor.seatIdx + 1 },
              }),
            )
            .otherwise(() => clone),
        )
        .value(),
    );
}
