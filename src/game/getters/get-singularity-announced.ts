import { cloneDeep } from 'lodash-es';

import { getGameState } from '@/stores/game-state';

export function getSingularityAnnounced(): boolean {
  return Object.freeze(cloneDeep(getGameState().singularityAnnounced));
}
