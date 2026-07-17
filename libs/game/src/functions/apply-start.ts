import { assign, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { log } from './log';

export const applyStart = (state: GameState): GameState =>
  match(state)
    .when(
      () => state.cursor.phase !== 'setup',
      () => state,
    )
    .otherwise(() =>
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
