import type { GameState } from '@/game/types';
import { getOfferResolve, setOfferResolve } from '../common/resolver-state';

export interface ResolveOfferPayload {
  playerId: number;
  accept: boolean;
}

/* The `resolveOffer` store action: the target seat of getPendingOffer()
   accepts or declines it. The human's TradeOfferModal and the AI agent
   both dispatch this; it answers the engine's parked waitOffer(). */
export function resolveOffer(
  state: GameState,
  payload: ResolveOfferPayload,
): void {
  const { playerId, accept } = payload;

  const resolve = getOfferResolve();

  const offer = state.pendingOffer;

  if (!resolve || !offer || offer.toId !== playerId) {
    return;
  }

  setOfferResolve(null);

  state.pendingOffer = null;

  resolve(accept);
}
