import type { GameState, Player, TradeOffer } from '@/game/types';
import { getOfferResolve, setOfferResolve } from './resolver-state';

export function askHumanOffer(
  state: GameState,
  from: Player,
  offer: TradeOffer,
): Promise<boolean> {
  return new Promise((res) => {
    setOfferResolve(res);
    state.pendingOffer = {
      fromId: from.id,
      gives: offer.gives,
      gets: offer.gets,
    };
  });
}
