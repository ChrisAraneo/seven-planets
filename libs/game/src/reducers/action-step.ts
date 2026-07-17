import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { getSeatStatus } from '../functions/get-seat-status';
import { setStatus } from '../functions/set-status';
import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import type { ActionCursor, ActionFrame } from './seat-frame';
import { isQueueExhausted, seatPlayer } from './seat-frame';
import { startNextTurn } from './turn-flow';

export function actionStep(state: GameState, cursor: ActionCursor): GameState {
  return match({ state, cursor })
    .when(isQueueExhausted, () => startNextTurn(state))
    .when(isSeatSittingOut, skipSeat)
    .otherwise(parkAction);
}

function isSeatSittingOut(frame: ActionFrame): boolean {
  return chain(seatPlayer(frame))
    .thru((player) => !player.isAlive || player.isSkippedNow)
    .value();
}

function skipSeat({ state, cursor }: ActionFrame): GameState {
  return assign(state, {
    cursor: { ...cursor, seatIdx: cursor.seatIdx + 1 },
  });
}

function parkAction(frame: ActionFrame): GameState {
  return chain(seatPlayer(frame))
    .tap((player) => assign(frame.state, { activeId: player.id }))
    .tap((player) =>
      assign(frame.state, setStatus(frame.state, getSeatStatus(player))),
    )
    .thru(() =>
      assign(frame.state, {
        isAwaitingAction: true,
        inputSeq: frame.state.inputSeq + 1,
      }),
    )
    .value();
}
