import type { LogEntry } from '../interfaces/log-entry';
import { getGameState } from '../game-state';

export function getLog(): readonly LogEntry[] {
  return getGameState().log;
}
