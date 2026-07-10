import { cloneDeep } from 'lodash-es';

import type { Phase } from '../interfaces/phase';
import { getGameState } from '../game-state';

export function getPhase(): Phase {
  return Object.freeze(cloneDeep(getGameState().phase));
}
