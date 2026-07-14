import { cloneDeep, assign } from 'lodash-es';
import { chain } from '../../utils/chain';
import { match } from 'ts-pattern';
import type { EndTurnPayload } from '../../actions/end-turn/end-turn';
import type { GameState } from '../../interfaces/game-state';

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
