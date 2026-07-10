import { cloneDeep } from 'lodash-es';

import { getGameState } from '../game-state';

export function getStatus(): string {
  return Object.freeze(cloneDeep(getGameState().status));
}
