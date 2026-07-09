import { cloneDeep } from 'lodash-es';

import type { PendingOffer } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function getPendingOffer(): PendingOffer | null {
  return Object.freeze(cloneDeep(getGameState().pendingOffer));
}
