import { getTurnOrder } from '../functions/extractors/get-turn-order';
import type { GameState } from '../interfaces/game-state';
import type { ActionCursor } from './seat-frame';

export const getActionCursor = (state: GameState): ActionCursor => ({
  phase: 'ACTION',
  seatQueue: getTurnOrder(state).map((player) => player.id),
  seatIdx: 0,
});
