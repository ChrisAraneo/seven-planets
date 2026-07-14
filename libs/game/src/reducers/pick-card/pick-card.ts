import { assign, cloneDeep } from 'lodash-es';
import { chain } from '../../utils/chain';
import { match } from 'ts-pattern';
import type { GameState } from '../../interfaces/game-state';
import type { PickCardPayload } from '../../actions/pick-card/pick-card';
import { applyPick } from './apply-pick';
import { isValidPick } from './is-valid-pick';

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
