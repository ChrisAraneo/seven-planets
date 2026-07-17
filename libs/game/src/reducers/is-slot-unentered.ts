import type { DraftFrame } from './seat-frame';

export const isSlotUnentered = ({ cursor }: DraftFrame): boolean =>
  cursor.picksTotal === -1;
