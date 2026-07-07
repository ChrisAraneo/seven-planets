import type { Player, TradeOffer } from '@/game/types';
import { getState } from '../state';
import { getOfferResolve, setOfferResolve } from './resolver-state';

export function askHumanOffer(
  from: Player,
  offer: TradeOffer,
): Promise<boolean> {
  return new Promise((res) => {
    setOfferResolve(res);
    getState().pendingOffer = {
      fromId: from.id,
      gives: offer.gives,
      gets: offer.gets,
    };
  });
}
