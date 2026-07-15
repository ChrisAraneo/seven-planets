import type { GameState } from '../interfaces/game-state';
import type { LogEntry } from '../interfaces/log-entry';

// Append a log entry, keeping the tail capped at 500. Pure: returns a new state
// with a new log array; the input is untouched.
export function log(
  state: GameState,
  message: string,
  cssClass = 'sys',
): GameState {
  return {
    ...state,
    log: ([...state.log, { message, cssClass }] as LogEntry[]).slice(-500),
  };
}
