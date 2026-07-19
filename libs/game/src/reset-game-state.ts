import { createInitialGameState } from './functions/create-initial-game-state';
import { STATE_SUBJECT } from './state';

export const resetGameState = (): void => {
  STATE_SUBJECT.next(createInitialGameState());
};
