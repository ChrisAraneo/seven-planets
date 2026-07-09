import { cloneDeep } from 'lodash-es';

import { getGameState } from '@/stores/game-state';

export function getTurn(): number {
  return Object.freeze(cloneDeep(getGameState().turn));
}
