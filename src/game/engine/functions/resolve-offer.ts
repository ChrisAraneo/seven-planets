import { getGameState } from '@/stores/game-state';

import { getOfferResolve, setOfferResolve } from './resolver-state';

export function resolveOffer(accept: boolean): void {
  const state = getGameState();
  const r = getOfferResolve();
  if (!r) {
    return;
  }
  setOfferResolve(null);
  state.pendingOffer = null;
  r(accept);
}
