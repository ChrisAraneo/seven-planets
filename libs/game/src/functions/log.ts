import type { GameState } from '../interfaces/game-state';
import type { LogEntry } from '../interfaces/log-entry';

const LOG_TAIL_CAP = 500;

export function log(
  state: GameState,
  message: string,
  cssClass = 'sys',
): GameState {
  return {
    ...state,
    log: ([...state.log, { message, cssClass }] as LogEntry[]).slice(
      -LOG_TAIL_CAP,
    ),
  };
}
