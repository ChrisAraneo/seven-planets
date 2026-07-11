import type { Cost } from '../interfaces/cost';
import { getGameState, setGameState } from '../game-state';
import { cloneDeep } from 'lodash-es';

import { RESOURCE_TYPES, CARDS } from '../config/constants';
import { setStatus } from '../functions/set-status';
import { AUTO_HUMAN } from '../functions/auto-human';
import { hasActionCard } from '../functions/has-action-card';
import { log } from '../functions/log';
import { getPendingOfferCallback } from '../functions/resolver-state';

export interface MakeOfferPayload {
  playerId: number;
  partnerId: number;
  gives: Cost;
  gets: Cost;
}

/* Sets pendingOffer on game state and returns immediately. The partner
   seat (human via TradeOfferModal, or the AI watcher) must answer by
   dispatching resolveOffer, which executes or declines the trade. */
export function makeOffer(payload: MakeOfferPayload): void {
  const { playerId, partnerId, gives, gets } = payload;
  const state = cloneDeep(getGameState());

  if (playerId !== state.activeId || state.over) {
    return;
  }

  const player = state.players[playerId];
  const partner = state.players[partnerId];

  if (!partner || partner.id === player.id || !partner.alive) {
    return;
  }

  if (!hasActionCard(player, 'TRADE')) {
    return;
  }

  // Note the attempt; the AI plans at most one trade per turn off this flag
  // (nothing restricts the human's seat, matching the original behavior).
  player.tradedThisTurn = true;

  const wantKey = Object.keys(gets)[0];

  if (wantKey && RESOURCE_TYPES.includes(wantKey as never)) {
    Object.assign(
      state,
      log(
        state,
        `📡 ${player.name} opens a trade channel — seeking ${CARDS[wantKey].icon} ${CARDS[wantKey].name}`,
        'trade',
      ),
    );
  }

  const humanControlled = partner.isHuman && !AUTO_HUMAN;

  if (humanControlled) {
    Object.assign(
      state,
      setStatus(state, `${player.name} is hailing you with a trade offer…`),
    );
  }

  state.pendingOffer = { fromId: playerId, toId: partnerId, gives, gets };

  setGameState(state);

  // Notify synchronously so AI seats can respond without relying on async
  // Vue watchers, which may not fire reliably across full state replacements.
  getPendingOfferCallback()?.(partnerId);
}
