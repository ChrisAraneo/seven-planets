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
        .tap((clone) => assign(clone, { isAwaitingAction: false }))
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
