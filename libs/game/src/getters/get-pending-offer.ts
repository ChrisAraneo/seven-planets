import type { PendingOffer } from '../interfaces/pending-offer';
import { getGameState } from '../state';

export function getPendingOffer(): PendingOffer | null {
  return getGameState().pendingOffer;
}
