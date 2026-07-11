import { chain } from 'lodash-es';
import { match } from 'ts-pattern';
import { getOver } from '../getters/get-over';
import { getGameState } from '../game-state';
import type { Player } from '../interfaces/player';

import { AUTO_HUMAN } from './auto-human';
import { humanActionTurn } from './human-action-turn';
import { setStatus } from './set-status';
import { turnOrder } from './turn-order';

/* Every seat's action turn is handled identically: raise `awaitingAction`
   and park. The human answers by ending their turn from the UI; an AI seat
   is answered by the `ai` store module, which watches the same flag, plays
   its actions and dispatches `endTurn` to unpark us. */
export async function runActionPhase(): Promise<void> {
  return chain(Object.assign(getGameState(), { phase: 'action' }))
    .thru((s) => runSeats(turnOrder(s).map((p) => p.id)))
    .value();
}

// Recursion instead of a loop: game-over is re-checked as each seat settles.
async function runSeats(seatIds: number[]): Promise<void> {
  return match(seatIds)
    .when(
      (ids) => ids.length === 0 || Boolean(getOver()),
      async (): Promise<void> => undefined,
    )
    .otherwise(([seatId, ...rest]) =>
      runSeat(seatId).then(() => runSeats(rest)),
    );
}

async function runSeat(seatId: number): Promise<void> {
  return match(getGameState().players[seatId])
    .when(
      (p) => !p.isAlive || p.skippedNow,
      async (): Promise<void> => undefined,
    )
    .otherwise((p) =>
      chain(Object.assign(getGameState(), { activeId: seatId }))
        .tap((s) => Object.assign(s, setStatus(s, seatStatus(p))))
        .thru((s) => humanActionTurn(s))
        .value(),
    );
}

function seatStatus(p: Player): string {
  return match(p)
    .when(
      (x) => x.isHuman && !AUTO_HUMAN,
      () => 'YOUR TURN — recruit, attack or trade. End turn when done.',
    )
    .otherwise((x) => `${x.name} is taking actions…`);
}
