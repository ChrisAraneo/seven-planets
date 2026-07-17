import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { turnPrelude } from '../functions/turn-prelude';
import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { finishGame } from './finish-game';
import { getDraftCursor } from './get-draft-cursor';

export const startNextTurn = (state: GameState): GameState =>
  match(state)
    .when(() => state.turn >= state.maxTurns, finishGame)
    .otherwise(() =>
      chain(state)
        .tap(turnPrelude)
        .thru(() =>
          assign(state, { phase: 'draft', cursor: getDraftCursor(state) }),
        )
        .value(),
    );
