import { assign, cloneDeep, get } from 'lodash-es';
import { match } from 'ts-pattern';

import type { EndTurnPayload } from '../../actions/end-turn';
import type { EngineCursor } from '../../interfaces/engine-cursor';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';

// TODO: OK
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
        .tap((clonedState) => assign(clonedState, { isAwaitingAction: false }))
        .tap((clonedState) =>
          match(clonedState.cursor)
            .with({ phase: 'ACTION' }, (cursor: EngineCursor) =>
              assign(clonedState, {
                cursor: { ...cursor, seatIdx: get(cursor, 'seatIdx', 0) + 1 },
              }),
            )
            .otherwise(() => clonedState),
        )
        .value(),
    );
