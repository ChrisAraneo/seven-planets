import { getOver } from '@/stores/game/getters/get-over';
import {
  getHumanResolve,
  getOfferResolve,
  getPoolResolve,
  setHumanResolve,
  setOfferResolve,
  setPoolResolve,
} from '@/game/actions/common/resolver-state';
import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { log } from './log';
import { setStatus } from './set-status';

export function triggerGameOver(
  winner: Player | null,
  reason: 'conquest' | 'eliminated',
): void {
  const state = getGameState();
  if (getOver()) {
    return;
  }
  state.over = { winner, reason };
  if (reason === 'conquest' && winner) {
    log(
      `🏴 ${winner.name} rules all seven planets! The galaxy has one master.`,
      'win',
    );
  }
  if (reason === 'eliminated') {
    log('☠️ Your homeworld has fallen. The galaxy forgets Terra Prime.', 'win');
  }
  setStatus(
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
