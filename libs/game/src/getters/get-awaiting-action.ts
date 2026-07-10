import { cloneDeep } from 'lodash-es';

import { getGameState } from '../game-state';

export function getAwaitingAction(): boolean {
  return Object.freeze(cloneDeep(getGameState().awaitingAction));
}
