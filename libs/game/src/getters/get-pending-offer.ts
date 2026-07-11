import type { PendingOffer } from '../interfaces/pending-offer';
import { getGameState } from '../game-state';

export function getPendingOffer(): PendingOffer | null {
  return getGameState().pendingOffer;
}
