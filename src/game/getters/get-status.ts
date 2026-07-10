import { cloneDeep } from 'lodash-es';

import { getGameState } from '@/stores/game-state';

export function getStatus(): string {
  return Object.freeze(cloneDeep(getGameState().status));
}
