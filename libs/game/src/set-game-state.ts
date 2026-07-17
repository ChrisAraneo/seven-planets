import type { GameState } from './interfaces/game-state';
import { stateSubject } from './state';

export const setGameState = (state: GameState): void => {
  stateSubject.next(state);
};
