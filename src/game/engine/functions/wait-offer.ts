import {
  getOfferResolve,
  setOfferResolve,
} from '@/game/engine/functions/resolver-state';
import type { Player, TradeOffer } from '@/game/types';
import { getGameState } from '@/stores/game-state';

/** Publish `from`'s offer as state.pendingOffer and park until the target
    seat answers with the `resolveOffer` store action — the human's modal
    and the AI agent resolve this the exact same way. */
export function waitOffer(from: Player, offer: TradeOffer): Promise<boolean> {
  const state = getGameState();
  return new Promise((res) => {
    setOfferResolve(res);
    state.pendingOffer = {
      fromId: from.id,
      toId: offer.partner.id,
      gives: offer.gives,
      gets: offer.gets,
    };
  });
}
