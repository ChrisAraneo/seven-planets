import { assign } from 'lodash-es';
import { match } from 'ts-pattern';
import { getOver } from '../getters/get-over';
import { getGameState } from '../game-state';
import type { Player } from '../interfaces/player';

import { AUTO_HUMAN } from './auto-human';
import { setStatus } from './set-status';
import { turnOrder } from './turn-order';
import type { EngineGen } from './engine-driver';

/* Every seat's action turn is handled identically: raise `awaitingAction`
   (bumping inputSeq) and suspend. The human answers by ending their turn
   from the UI; an AI seat is answered by the AI, which WATCHES inputSeq
   on the state, plays its actions and dispatches the same `endTurn` to
   resume the engine. */
export function* runActionPhase(): EngineGen {
  assign(getGameState(), { phase: 'action' });
  const seatIds = turnOrder(getGameState()).map((player) => player.id);
  for (const seatId of seatIds) {
    // Game-over is re-checked as each seat settles.
    if (getOver()) {
      return;
    }
    yield* runSeat(seatId);
  }
}

function* runSeat(seatId: number): EngineGen {
  const player = getGameState().players[seatId];
  if (!player.isAlive || player.skippedNow) {
    return;
  }
  const state = assign(getGameState(), { activeId: seatId });
  assign(state, setStatus(state, seatStatus(player)));
  // Raise the flag on the live state and suspend until `endTurn` resumes us.
  assign(state, { awaitingAction: true, inputSeq: state.inputSeq + 1 });
  yield { kind: 'action' };
}

function seatStatus(player: Player): string {
  return match(player)
    .when(
      (player) => player.isHuman && !AUTO_HUMAN,
      () => 'YOUR TURN — recruit, attack or trade. End turn when done.',
    )
    .otherwise((player) => `${player.name} is taking actions…`);
}
