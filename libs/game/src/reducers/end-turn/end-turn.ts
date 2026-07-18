import { assign, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { EndTurnPayload } from '../../actions/end-turn';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';

export const applyEndTurn = (
  state: GameState,
  payload: EndTurnPayload,
): GameState =>
  match(state)
    .when(
      () => payload.playerId !== state.activeId || !state.isAwaitingAction,
      () => state,
    )
    .otherwise(() =>
      chain(cloneDeep(state))
        .tap((cl1) => assign(cl1, { isAwaitingAction: false }))
        .tap((cl1) =>
          match(cl1.cursor)
            .with({ phase: 'action' }, (cursor) =>
              assign(cl1, {
                cursor: { ...cursor, seatIdx: cursor.seatIdx + 1 },
              }),
            )
            .otherwise(() => cl1),
        )
        .value(),
    );
