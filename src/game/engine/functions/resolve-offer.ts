import { getState } from '../state';
import { getOfferResolve, setOfferResolve } from './resolver-state';

export function resolveOffer(accept: boolean): void {
  const r = getOfferResolve();
  if (!r) {
    return;
  }
  setOfferResolve(null);
  getState().pendingOffer = null;
  r(accept);
}
