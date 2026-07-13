import type { LogEntry } from '../interfaces/log-entry';
import { getGameStateLastValue } from '../state';

export function getLog(): readonly LogEntry[] {
  return getGameStateLastValue().log;
}
