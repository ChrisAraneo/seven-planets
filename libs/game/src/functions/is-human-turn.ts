// NOTE: This function is not used anywhere in the current codebase.
// The store implements the same logic as a Vue computed property instead.
import type { GameState } from '../interfaces/game-state';

export function isHumanTurn(state: GameState): boolean {
  return state.awaitingAction && !state.over;
}
