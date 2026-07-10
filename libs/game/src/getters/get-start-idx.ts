import { cloneDeep } from 'lodash-es';

import { getGameState } from '../game-state';

export function getStartIdx(): number {
  return Object.freeze(cloneDeep(getGameState().startIdx));
}
