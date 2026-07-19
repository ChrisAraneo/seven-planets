import type { GameState } from '../interfaces/game-state';

export const setStatus = (state: GameState, message: string): GameState => ({
  ...state,
  status: message,
});
