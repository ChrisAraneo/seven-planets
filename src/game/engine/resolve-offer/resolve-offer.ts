import type { fmtCards } from '@/game/constants';
import type { Player, Cost, GameState } from '@/game/types';
import { getGameState } from '@/stores/game-state';
import { log } from '../common/log';
import { getOfferResolve, setOfferResolve } from '../common/resolver-state';
import { spendActionCard } from '../common/spend-action-card';

/* The `resolveOffer` store action: the target seat of getPendingOffer()
   accepts or declines it. The human's TradeOfferModal and the AI agent
   both dispatch this; it answers the engine's parked waitOffer(). */
export function resolveOffer(
  state: GameState,
  payload: {
    playerId: number;
    accept: boolean;
  },
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
