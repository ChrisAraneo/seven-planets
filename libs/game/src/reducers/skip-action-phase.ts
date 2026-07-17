import { assign } from 'lodash-es';

import { ACTION_CARDS_FROM_TURN } from '../config/constants';
import { log } from '../functions/log';
import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { startNextTurn } from './start-next-turn';

export const skipActionPhase = (state: GameState): GameState =>
  chain(
    assign(
      state,
      log(
        state,
        `🛰️ Fleets hold position — action cards reach the sector on turn ${ACTION_CARDS_FROM_TURN}.`,
        'sys',
      ),
    ),
  )
    .thru(startNextTurn)
    .value();
