import type { GameState } from '../interfaces/game-state';

export function setBusy(state: GameState, value: boolean): GameState {
  return { ...state, busy: value };
}
