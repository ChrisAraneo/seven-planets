import { getDraftOrder } from '../functions/get-draft-order';
import type { GameState } from '../interfaces/game-state';
import type { DraftCursor } from './seat-frame';

export const getDraftCursor = (state: GameState): DraftCursor => ({
  phase: 'draft',
  seatQueue: getDraftOrder(state).map((player) => player.id),
  seatIdx: 0,
  slot: 0,
  pick: 0,
  picksTotal: -1,
});
