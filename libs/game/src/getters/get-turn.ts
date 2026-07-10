import { cloneDeep } from 'lodash-es';

import { getGameState } from '../game-state';

export function getTurn(): number {
  return Object.freeze(cloneDeep(getGameState().turn));
}
