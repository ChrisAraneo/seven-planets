import type { GameState } from './interfaces/game-state';
import { STATE_SUBJECT } from './state';

export const setGameState = (state: GameState): void => {
  STATE_SUBJECT.next(state);
};
