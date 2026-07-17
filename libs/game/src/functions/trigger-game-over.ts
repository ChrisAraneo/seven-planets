import { match, P } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { log } from './log';
import { setStatus } from './set-status';

const { nonNullable } = P;

type GameOverReason = 'conquest' | 'eliminated';

// End the game. Pure w.r.t. GameState — returns a new state carrying the result.
// It does NOT touch the engine or its parked-input flags: the coroutine unwinds
// On its own once `over` is set. A win taken during the draft aborts the current
// Step synchronously; one taken during an action turn is unwound by the seat's
// Own `endTurn` (the AI always ends its turn; the UI's turn is already over).
export function triggerGameOver(
  state: GameState,
  winnerId: number | null,
  reason: GameOverReason,
): GameState {
  return match(state)
    .when(
      () => Boolean(state.over),
      () => state,
    )
    .otherwise(() => endGame(state, getWinnerFor(state, winnerId), reason));
}

function getWinnerFor(
  state: GameState,
  winnerId: number | null,
): Player | null {
  return match(winnerId)
    .with(null, (): Player | null => null)
    .otherwise((id) => state.players[id]);
}

function endGame(
  state: GameState,
  winner: Player | null,
  reason: GameOverReason,
): GameState {
  return chain({ ...state, over: { winner, reason } } as GameState)
    .thru((current) => logOutcome(current, winner, reason))
    .thru((current) => setStatus(current, getStatusLine(winner, reason)))
    .thru((current) => ({ ...current, pendingOffer: null }))
    .value();
}

function logOutcome(
  state: GameState,
  winner: Player | null,
  reason: GameOverReason,
): GameState {
  return match({ winner, reason })
    .with({ reason: 'conquest', winner: nonNullable }, ({ winner: player }) =>
      log(
        state,
        `🏴 ${player.name} rules all seven planets! The galaxy has one master.`,
        'win',
      ),
    )
    .with({ reason: 'eliminated' }, () =>
      log(
        state,
        '☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.',
        'win',
      ),
    )
    .otherwise(() => state);
}

function getStatusLine(winner: Player | null, reason: GameOverReason): string {
  return match(winner)
    .with(
      nonNullable,
      (player) => `GAME OVER — ${player.name} wins by ${reason}.`,
    )
    .otherwise(() => 'GAME OVER — your homeworld has fallen.');
}
