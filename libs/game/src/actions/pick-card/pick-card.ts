import { assign, chain, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';
import type { GameState } from '../../interfaces/game-state';
import { dispatch } from '../../state';
import { applyPick } from './functions/apply-pick';
import { isValidPick } from './functions/is-valid-pick';

export interface PickCardPayload {
  playerId: number;
  idx: number;
}

/** Answer a parked draft pick with the chosen pool index. Event creator:
    validation and application live in the reducer (applyPickCard). */
export function pickCard(payload: PickCardPayload): void {
  dispatch({ kind: 'pick', ...payload });
}

/* Reducer branch. An illegal pick reduces to the unchanged state (still
   parked — the seat must answer again); a pick arriving after game over
   consumes the park without applying the card (the old mid-draft abort),
   so advance can settle the cursor. A legal pick applies the card and
   bumps the cursor's pick counter — the recorded answer advance resumes
   from. */
export function applyPickCard(
  state: GameState,
  payload: PickCardPayload,
): GameState {
  return match(state)
    .when(
      (state) =>
        !state.awaitingPick ||
        state.phase !== 'draft' ||
        payload.playerId !== state.activeId,
      (state) => state,
    )
    .when(
      (state) => Boolean(state.over),
      (state) => assign(cloneDeep(state), { awaitingPick: false }),
    )
    .when(
      (state) => !isValidPick(state, payload),
      (state) => state,
    )
    .otherwise((state) =>
      chain(cloneDeep(state))
        .tap((clone) => assign(clone, { awaitingPick: false }))
        .tap((clone) =>
          applyPick(
            clone,
            payload.idx,
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
