import type { GameState } from '../interfaces/game-state';

export function setStatus(state: GameState, msg: string): GameState {
  return { ...state, status: msg };
}
