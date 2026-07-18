import { PICKS_TOTAL_UNSET } from '../config/constants';
import type { DraftFrame } from './seat-frame';

export const isSlotUnentered = ({ cursor }: DraftFrame): boolean =>
  cursor.picksTotal === PICKS_TOTAL_UNSET;
