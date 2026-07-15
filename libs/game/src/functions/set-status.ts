import type { GameState } from '../interfaces/game-state';

export function setStatus(state: GameState, message: string): GameState {
  return { ...state, status: message };
}
