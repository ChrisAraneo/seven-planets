import { dispatch } from '../../dispatch';
import type { Cost } from '../../interfaces/cost';

export interface MakeOfferPayload {
  playerId: number;
  partnerId: number;
  gives: Cost;
  gets: Cost;
}

export const makeOffer = (payload: MakeOfferPayload): void => {
  dispatch({ kind: 'MAKE_OFFER', payload });
};
