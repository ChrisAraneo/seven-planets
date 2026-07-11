import { chain } from 'lodash-es';
import { match, P } from 'ts-pattern';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { log } from './log';
import { setStatus } from './set-status';
import {
  getHumanResolve,
  setHumanResolve,
  getPoolResolve,
  setPoolResolve,
} from './resolver-state';

const { nonNullable, nullish } = P;

type GameOverReason = 'conquest' | 'eliminated';

// End the game. Pure w.r.t. GameState (returns a new state carrying the result and
// the cleared input flags). The parked-resolver callbacks it fires are control-flow
// plumbing (resolver-state is not game state), kept as the minimal residual effect.
export function triggerGameOver(
  state: GameState,
  winnerId: number | null,
  reason: GameOverReason,
): GameState {
  return match(state)
    .when(
      (s) => Boolean(s.over),
      (s) => s,
    )
    .otherwise((s) => endGame(s, winnerFor(s, winnerId), reason));
}

function winnerFor(state: GameState, winnerId: number | null): Player | null {
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
    .thru((s) => logOutcome(s, winner, reason))
    .thru((s) => setStatus(s, statusLine(winner, reason)))
    .thru((s) => releaseHumanResolve(s))
    .thru((s) => releasePoolResolve(s))
    .thru((s) => ({ ...s, pendingOffer: null }))
    .value();
}

function logOutcome(
  s: GameState,
  winner: Player | null,
  reason: GameOverReason,
): GameState {
  return match({ winner, reason })
    .with({ reason: 'conquest', winner: nonNullable }, ({ winner: w }) =>
      log(
        s,
        `🏴 ${w.name} rules all seven planets! The galaxy has one master.`,
        'win',
      ),
    )
    .with({ reason: 'eliminated' }, () =>
      log(
        s,
        '☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.',
        'win',
      ),
    )
    .otherwise(() => s);
}

function statusLine(winner: Player | null, reason: GameOverReason): string {
  return match(winner)
    .with(nonNullable, (w) => `GAME OVER — ${w.name} wins by ${reason}.`)
    .otherwise(() => 'GAME OVER — your homeworld has fallen.');
}

// Unblock whatever input the loop is parked on — nobody answers now.
function releaseHumanResolve(s: GameState): GameState {
  return match(getHumanResolve())
    .with(nullish, () => s)
    .otherwise((end) =>
      chain({ ...s, awaitingAction: false } as GameState)
        .tap(() => setHumanResolve(null))
        .tap(() => end())
        .value(),
    );
}

function releasePoolResolve(s: GameState): GameState {
  return match(getPoolResolve())
    .with(nullish, () => s)
    .otherwise((pick) =>
      chain({ ...s, awaitingPick: false } as GameState)
        .tap(() => setPoolResolve(null))
        .tap(() => pick(0))
        .value(),
    );
}
