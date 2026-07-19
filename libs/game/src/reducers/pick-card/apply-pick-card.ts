import { assign, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { PickCardPayload } from '../../actions/pick-card';
import { MAIN_SLOT } from '../../config/constants';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { applyPick } from './internal/apply-pick';
import { isValidPick } from './internal/is-valid-pick';

export const applyPickCard = (
  state: GameState,
  payload: PickCardPayload,
): GameState =>
  match(state)
    .when(
      () =>
        !state.isAwaitingPick ||
        state.phase !== 'DRAFT' ||
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
        .tap((clonedState) => assign(clonedState, { isAwaitingPick: false }))
        .tap((clonedState) =>
          applyPick(
            clonedState,
            payload.index,
            payload.playerId,
            match(clonedState.cursor)
              .with({ phase: 'DRAFT' }, (cursor) => cursor.slot)
              .otherwise(() => MAIN_SLOT),
          ),
        )
        .tap((clonedState) =>
          match(clonedState.cursor)
            .with({ phase: 'DRAFT' }, (cursor) =>
              assign(clonedState, {
                cursor: { ...cursor, pick: cursor.pick + 1 },
              }),
            )
            .otherwise(() => clonedState),
        )
        .value(),
    );
