import type { GameState } from '../interfaces/game-state';
import type { LogEntry } from '../interfaces/log-entry';

// Append a log entry, keeping the tail capped at 500. Pure: returns a new state
// with a new log array; the input is untouched.
export function log(state: GameState, msg: string, cls = 'sys'): GameState {
  const entries: LogEntry[] = [...state.log, { msg, cls }];

  while (entries.length > 500) {
    entries.shift();
  }

  return { ...state, log: entries };
}
