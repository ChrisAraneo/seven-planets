import { cloneDeep } from 'lodash-es';

import { getGameState } from '@/stores/game-state';

export function getDraftPlanetId(): number {
  return Object.freeze(cloneDeep(getGameState().draftPlanetId));
}
