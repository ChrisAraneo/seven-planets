import { dispatch } from '../../state';

export interface ResolveOfferPayload {
  playerId: number;
  isAccepted: boolean;
}

export function resolveOffer(payload: ResolveOfferPayload): void {
  dispatch({ kind: 'RESOLVE_OFFER', payload });
}
