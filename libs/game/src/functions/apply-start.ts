import { assign, cloneDeep } from 'lodash-es';
import { chain } from '../utils/chain';
import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { log } from './log';

/* Reducer branch for the 'start' intent: log the welcome lines and step the
   cursor to the between-turns position (an exhausted action queue), from
   which advance runs the first turn's prelude. A second 'start' is a no-op. */
export function applyStart(state: GameState): GameState {
  return match(state)
    .when(
      (state) => state.cursor.phase !== 'setup',
      (state) => state,
    )
    .otherwise((state) =>
      chain(cloneDeep(state))
        .thru((clone) =>
          assign(
            clone,
            log(clone, 'SEVEN PLANETS — seven worlds, one victor.', 'sys'),
          ),
        )
        .thru((clone) =>
          assign(
            clone,
            log(
              clone,
              'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
              'sys',
            ),
          ),
        )
        .thru((clone) =>
          assign(clone, {
            cursor: { phase: 'action' as const, seatQueue: [], seatIdx: 0 },
          }),
        )
        .value(),
    );
}
