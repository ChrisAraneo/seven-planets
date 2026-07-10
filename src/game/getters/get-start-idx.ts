import { cloneDeep } from 'lodash-es';

import { getGameState } from '@/stores/game-state';

export function getStartIdx(): number {
  return Object.freeze(cloneDeep(getGameState().startIdx));
}
