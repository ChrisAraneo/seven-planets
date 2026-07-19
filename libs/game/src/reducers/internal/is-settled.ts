import type { GameState } from '../../interfaces/game-state';

export const isSettled = (state: GameState): boolean =>
  state.isAwaitingPick ||
  state.isAwaitingAction ||
  state.cursor.phase === 'SETUP' ||
  state.cursor.phase === 'd1';
