import type { LogEntry } from '../interfaces/log-entry';
import { getGameState } from '../state';

export function getLog(): readonly LogEntry[] {
  return getGameState().log;
}
