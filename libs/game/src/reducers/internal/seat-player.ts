import type { Player } from '../../interfaces/player';
import type { SeatFrame } from './seat-frame';

export const seatPlayer = ({ state, cursor }: SeatFrame): Player =>
  state.players[cursor.seatQueue[cursor.seatIdx]];
