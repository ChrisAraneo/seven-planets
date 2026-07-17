import type { DraftFrame } from './seat-frame';

export const isSlotFinished = ({ state, cursor }: DraftFrame): boolean =>
  state.pool.length === 0 ||
  (cursor.picksTotal !== -1 && cursor.pick >= cursor.picksTotal);
