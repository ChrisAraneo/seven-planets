import { chain, noop } from 'lodash-es';
import { getGameState } from '../game-state';

import { log } from './log';
import { playTurns } from './play-turns';
import { NO_PRESENTATION } from '../config/constants';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

export async function runGame(
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  return chain(getGameState())
    .tap((state) =>
      Object.assign(
        state,
        log(state, 'SEVEN PLANETS — seven worlds, one victor.', 'sys'),
      ),
    )
    .tap((state) =>
      Object.assign(
        state,
        log(
          state,
          'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
          'sys',
        ),
      ),
    )
    .thru(() => playTurns(400, hooks))
    .value()
    .then(() => Object.assign(getGameState(), { activeId: -1 }))
    .then(noop);
}
