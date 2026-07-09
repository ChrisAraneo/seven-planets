import { cloneDeep } from 'lodash-es';

import { getGameState } from '@/stores/game-state';

export function getAwaitingPick(): boolean {
  return Object.freeze(cloneDeep(getGameState().awaitingPick));
}
