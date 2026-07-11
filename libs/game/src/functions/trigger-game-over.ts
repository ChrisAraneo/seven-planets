import type { GameState } from '../interfaces/game-state';

import { log } from './log';
import { setStatus } from './set-status';
import {
  getHumanResolve,
  setHumanResolve,
  getPoolResolve,
  setPoolResolve,
  getOfferResolve,
  setOfferResolve,
} from './resolver-state';

// End the game. Pure w.r.t. GameState (returns a new state carrying the result and
// the cleared input flags). The parked-resolver callbacks it fires are control-flow
// plumbing (resolver-state is not game state), kept as the minimal residual effect.
export function triggerGameOver(
  state: GameState,
  winnerId: number | null,
  reason: 'conquest' | 'eliminated',
): GameState {
  if (state.over) {
    return state;
  }
  const winner = winnerId === null ? null : state.players[winnerId];
  let s: GameState = { ...state, over: { winner, reason } };
  if (reason === 'conquest' && winner) {
    s = log(
      s,
      `🏴 ${winner.name} rules all seven planets! The galaxy has one master.`,
      'win',
    );
  }
  if (reason === 'eliminated') {
    s = log(
      s,
      '☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.',
      'win',
    );
  }
  s = setStatus(
    s,
    winner
      ? `GAME OVER — ${winner.name} wins by ${reason}.`
      : 'GAME OVER — your homeworld has fallen.',
  );
  // Unblock whatever input the loop is parked on — nobody answers now.
  const end = getHumanResolve();
  if (end) {
    setHumanResolve(null);
    s = { ...s, awaitingAction: false };
    end();
  }
  const pick = getPoolResolve();
  if (pick) {
    setPoolResolve(null);
    s = { ...s, awaitingPick: false };
    pick(0);
  }
  const offer = getOfferResolve();
  if (offer) {
    setOfferResolve(null);
    s = { ...s, pendingOffer: null };
    offer(false);
  }
  return s;
}
