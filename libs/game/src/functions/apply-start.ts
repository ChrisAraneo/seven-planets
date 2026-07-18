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
        .thru((cl1) =>
          assign(
            cl1,
            log(cl1, 'SEVEN PLANETS — seven worlds, 1 victor.', 'sys'),
          ),
        )
        .thru((cl1) =>
          assign(
            cl1,
            log(
              cl1,
              'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
              'sys',
            ),
          ),
        )
        .thru((cl1) =>
          assign(cl1, {
            cursor: { phase: 'action' as const, seatQueue: [], seatIdx: 0 },
          }),
        )
        .value(),
    );
