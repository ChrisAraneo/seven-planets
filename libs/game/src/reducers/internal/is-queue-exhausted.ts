import type { SeatFrame } from './seat-frame';

export const isQueueExhausted = ({ cursor }: SeatFrame): boolean =>
  cursor.seatIdx >= cursor.seatQueue.length;
