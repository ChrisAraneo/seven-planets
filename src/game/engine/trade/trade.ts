import { getActiveId } from '@/stores/game/getters/get-active-id';
import { getOver } from '@/stores/game/getters/get-over';
import { getPendingOffer } from '@/stores/game/getters/get-pending-offer';
import {
  getOfferResolve,
  setOfferResolve,
} from '@/game/actions/common/resolver-state';
import type { Cost } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { hasActionCard } from '../common/has-action-card';
import { proposeTrade } from './functions/propose-trade';

/* The `trade` store action: propose a resource trade to another player.
   The human's TradeModal and the AI agent both dispatch this; the engine
   then asks the partner seat (human modal or AI agent) to answer via
   `resolveOffer`. Resolves with the partner's acceptance. */
export async function trade(payload: {
  playerId: number;
  partnerId: number;
  gives: Cost;
  gets: Cost;
}): Promise<boolean> {
  const state = getGameState();
  const { playerId, partnerId, gives, gets } = payload;
  if (playerId !== getActiveId() || getOver()) {
    return false;
  }
  const p = state.players[playerId];
  const partner = state.players[partnerId];
  if (!partner || partner.id === p.id || !partner.alive) {
    return false;
  }
  if (!hasActionCard(p, 'TRADE')) {
    return false;
  }
  // Note the attempt; the AI plans at most one trade per turn off this flag
  // (nothing restricts the human's seat, matching the original behavior).
  p.tradedThisTurn = true;
  return proposeTrade(p, { partner, gives, gets });
}

/* The `resolveOffer` store action: the target seat of getPendingOffer()
   accepts or declines it. The human's TradeOfferModal and the AI agent
   both dispatch this; it answers the engine's parked waitOffer(). */
export function resolveOffer(payload: {
  playerId: number;
  accept: boolean;
}): void {
  const state = getGameState();
  const { playerId, accept } = payload;
  const resolve = getOfferResolve();
  const offer = getPendingOffer();
  if (!resolve || !offer || offer.toId !== playerId) {
    return;
  }
  setOfferResolve(null);
  state.pendingOffer = null;
  resolve(accept);
}
