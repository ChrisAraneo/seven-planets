import { cloneDeep } from 'lodash-es';

import type { PendingOffer } from '../interfaces/pending-offer';
import { getGameState } from '../game-state';

export function getPendingOffer(): PendingOffer | null {
  return Object.freeze(cloneDeep(getGameState().pendingOffer));
}
