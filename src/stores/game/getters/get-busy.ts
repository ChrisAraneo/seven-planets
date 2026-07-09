import { cloneDeep } from 'lodash-es';

import { getGameState } from '@/stores/game-state';

export function getBusy(): boolean {
  return Object.freeze(cloneDeep(getGameState().busy));
}
