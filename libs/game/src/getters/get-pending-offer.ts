import { getGameStateLastValue } from '../get-game-state-last-value';
import type { PendingOffer } from '../interfaces/pending-offer';

export const getPendingOffer = (): PendingOffer | null =>
  getGameStateLastValue().pendingOffer;
