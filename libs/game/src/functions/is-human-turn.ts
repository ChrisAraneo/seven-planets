import type { GameState } from '../interfaces/game-state';

export const isHumanTurn = (state: GameState): boolean =>
  state.isAwaitingAction && !state.over;
