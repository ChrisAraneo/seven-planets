import { cloneDeep } from 'lodash-es';

import type { Phase } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function getPhase(): Phase {
  return Object.freeze(cloneDeep(getGameState().phase));
}
