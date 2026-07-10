import { cloneDeep } from 'lodash-es';

import type { LogEntry } from '../interfaces/log-entry';
import { getGameState } from '../game-state';

export function getLog(): readonly LogEntry[] {
  return Object.freeze(cloneDeep(getGameState().log));
}
