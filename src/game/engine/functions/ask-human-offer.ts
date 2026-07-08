import type { Player, TradeOffer } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { getOfferResolve, setOfferResolve } from './resolver-state';

export function askHumanOffer(
  from: Player,
  offer: TradeOffer,
): Promise<boolean> {
  const state = getGameState();
  return new Promise((res) => {
    setOfferResolve(res);
    state.pendingOffer = {
      fromId: from.id,
      gives: offer.gives,
      gets: offer.gets,
    };
  });
}
