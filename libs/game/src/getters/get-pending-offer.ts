import type { PendingOffer } from '../interfaces/pending-offer';
import { getGameStateLastValue } from '../state';

export function getPendingOffer(): PendingOffer | null {
  return getGameStateLastValue().pendingOffer;
}
