import type { Cost } from '../../interfaces/cost';
import { dispatch } from '../../state';

export interface MakeOfferPayload {
  playerId: number;
  partnerId: number;
  gives: Cost;
  gets: Cost;
}

export function makeOffer(payload: MakeOfferPayload): void {
  dispatch({ kind: 'MAKE_OFFER', payload });
}
