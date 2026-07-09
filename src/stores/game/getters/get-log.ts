import { cloneDeep } from 'lodash-es';

import type { LogEntry } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function getLog(): readonly LogEntry[] {
  return Object.freeze(cloneDeep(getGameState().log));
}
