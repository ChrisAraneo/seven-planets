import { createInitialGameState } from './functions/create-initial-game-state';
import { stateSubject } from './state';

export const resetGameState = (): void => {
  stateSubject.next(createInitialGameState());
};
