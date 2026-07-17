import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { getDraftOrder } from '../functions/get-draft-order';
import { turnPrelude } from '../functions/turn-prelude';
import type { EngineCursor } from '../interfaces/engine-cursor';
import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import type { DraftCursor } from './seat-frame';

// The turn cap stops the game BEFORE a new prelude starts (never mid-turn).
export function startNextTurn(state: GameState): GameState {
  return match(state)
    .when(() => state.turn >= state.maxTurns, finishGame)
    .otherwise(() =>
      chain(state)
        .tap(turnPrelude)
        .thru(() =>
          assign(state, { phase: 'draft', cursor: getDraftCursor(state) }),
        )
        .value(),
    );
}

function getDraftCursor(state: GameState): DraftCursor {
  return {
    phase: 'draft',
    seatQueue: getDraftOrder(state).map((player) => player.id),
    seatIdx: 0,
    slot: 0,
    pick: 0,
    picksTotal: -1,
  };
}

/* Terminal settle (game over or turn cap): clear the parked-input flags and
   the seat marker; the cursor rests at 'done'. */
export function finishGame(state: GameState): GameState {
  return assign(state, {
    isAwaitingPick: false,
    isAwaitingAction: false,
    activeId: -1,
    cursor: getDoneCursor(),
  });
}

function getDoneCursor(): EngineCursor {
  return { phase: 'done' };
}
