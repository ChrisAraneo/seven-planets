import { assign, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { PickCardPayload } from '../../actions/pick-card/pick-card';
import { MAIN_SLOT } from '../../config/constants';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { applyPick } from './apply-pick';
import { isValidPick } from './is-valid-pick';

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
        .tap((cl1) => assign(cl1, { isAwaitingPick: false }))
        .tap((cl1) =>
          applyPick(
            cl1,
            payload.index,
            payload.playerId,
            match(cl1.cursor)
              .with({ phase: 'DRAFT' }, (cursor) => cursor.slot)
              .otherwise(() => MAIN_SLOT),
          ),
        )
        .tap((cl1) =>
          match(cl1.cursor)
            .with({ phase: 'DRAFT' }, (cursor) =>
              assign(cl1, { cursor: { ...cursor, pick: cursor.pick + 1 } }),
            )
            .otherwise(() => cl1),
        )
        .value(),
    );
