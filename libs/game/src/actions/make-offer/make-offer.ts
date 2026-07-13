import { dispatch } from '../../state';
import type { Cost } from '../../interfaces/cost';

export interface MakeOfferPayload {
  playerId: number;
  partnerId: number;
  gives: Cost;
  gets: Cost;
}

/** Open a trade offer. Event creator: validation and application live in
    the reducer (applyMakeOffer). */
export function makeOffer(payload: MakeOfferPayload): void {
  dispatch({ kind: 'offer', payload });
}
