import type { GameState } from '../interfaces/game-state';

export function isHumanTurn(state: GameState): boolean {
  return state.isAwaitingAction && !state.over;
}
