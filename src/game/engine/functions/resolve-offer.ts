import type { GameState } from '@/game/types';
import { getOfferResolve, setOfferResolve } from './resolver-state';

export function resolveOffer(state: GameState, accept: boolean): void {
  const r = getOfferResolve();
  if (!r) {
    return;
  }
  setOfferResolve(null);
  state.pendingOffer = null;
  r(accept);
}
