import { dispatch } from '../../dispatch';

export interface ResolveOfferPayload {
  playerId: number;
  isAccepted: boolean;
}

export const resolveOffer = (payload: ResolveOfferPayload): void => {
  dispatch({ kind: 'RESOLVE_OFFER', payload });
};
