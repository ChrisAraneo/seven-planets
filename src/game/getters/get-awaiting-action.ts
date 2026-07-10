import { cloneDeep } from 'lodash-es';

import { getGameState } from '@/stores/game-state';

export function getAwaitingAction(): boolean {
  return Object.freeze(cloneDeep(getGameState().awaitingAction));
}
