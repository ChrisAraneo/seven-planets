import { PICKS_TOTAL_UNSET } from '../../config/constants';
import type { DraftFrame } from './seat-frame';

export const isSlotFinished = ({ state, cursor }: DraftFrame): boolean =>
  state.pool.length === 0 ||
  (cursor.picksTotal !== PICKS_TOTAL_UNSET && cursor.pick >= cursor.picksTotal);
