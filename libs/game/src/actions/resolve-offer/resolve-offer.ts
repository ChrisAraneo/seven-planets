import { dispatch } from '../../state';

export interface ResolveOfferPayload {
  playerId: number;
  accept: boolean;
}

/** Answer a pending trade offer. Event creator: validation and application
    live in the reducer (applyResolveOffer). */
export function resolveOffer(payload: ResolveOfferPayload): void {
  dispatch({ kind: 'RESOLVE_OFFER', payload });
}
