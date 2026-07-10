import type { GameState } from '../interfaces/game-state';

export function setStatus(state: GameState, msg: string): void {
  state.status = msg;
}
