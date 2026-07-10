import { cloneDeep } from 'lodash-es';

import { getGameState } from '../game-state';

export function getActiveId(): number {
  return Object.freeze(cloneDeep(getGameState().activeId));
}
