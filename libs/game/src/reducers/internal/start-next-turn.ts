import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { MAX_TURNS } from '../../config/constants';
import { turnPrelude } from '../../functions/turn-prelude';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { finishGame } from './finish-game';
import { getDraftCursor } from './get-draft-cursor';

export const startNextTurn = (state: GameState): GameState =>
  match(state)
    .when(() => state.turn >= MAX_TURNS, finishGame)
    .otherwise(() =>
      chain(state)
        .tap(turnPrelude)
        .thru(() =>
          assign(state, { phase: 'DRAFT', cursor: getDraftCursor(state) }),
        )
        .value(),
    );
