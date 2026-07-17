import { assign, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { PickCardPayload } from '../../actions/pick-card/pick-card';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { applyPick } from './apply-pick';
import { isValidPick } from './is-valid-pick';

export function applyPickCard(
  state: GameState,
  payload: PickCardPayload,
): GameState {
  return match(state)
    .when(
      () =>
        !state.isAwaitingPick ||
        state.phase !== 'draft' ||
        payload.playerId !== state.activeId,
      () => state,
    )
    .when(
      () => Boolean(state.over),
      () => assign(cloneDeep(state), { isAwaitingPick: false }),
    )
    .when(
      () => !isValidPick(state, payload),
      () => state,
    )
    .otherwise(() =>
      chain(cloneDeep(state))
        .tap((clone) => assign(clone, { isAwaitingPick: false }))
        .tap((clone) =>
          applyPick(
            clone,
            payload.index,
            payload.playerId,
            clone.cursor.phase === 'draft' ? clone.cursor.slot : 0,
          ),
        )
        .tap((clone) =>
          match(clone.cursor)
            .with({ phase: 'draft' }, (cursor) =>
              assign(clone, { cursor: { ...cursor, pick: cursor.pick + 1 } }),
            )
            .otherwise(() => clone),
        )
        .value(),
    );
}
