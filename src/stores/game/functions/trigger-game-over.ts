import { getOver } from '@/stores/game/getters/get-over';
import type { GameState, Player } from '@/game/types';

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

export function triggerGameOver(
  state: GameState,
  winner: Player | null,
  reason: 'conquest' | 'eliminated',
): void {
  if (getOver()) {
    return;
  }
  state.over = { winner, reason };
  if (reason === 'conquest' && winner) {
    log(
      state,
      `🏴 ${winner.name} rules all seven planets! The galaxy has one master.`,
      'win',
    );
  }
  if (reason === 'eliminated') {
    log(
      state,
      '☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.',
      'win',
    );
  }
  setStatus(
    state,
    winner
      ? `GAME OVER — ${winner.name} wins by ${reason}.`
      : 'GAME OVER — your homeworld has fallen.',
  );
  // Unblock whatever input the loop is parked on — nobody answers now.
  const end = getHumanResolve();
  if (end) {
    setHumanResolve(null);
    state.awaitingAction = false;
    end();
  }
  const pick = getPoolResolve();
  if (pick) {
    setPoolResolve(null);
    state.awaitingPick = false;
    pick(0);
  }
  const offer = getOfferResolve();
  if (offer) {
    setOfferResolve(null);
    state.pendingOffer = null;
    offer(false);
  }
}
