import { assign } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import type { DraftFrame } from './seat-frame';

export const nextSeat = ({ state, cursor }: DraftFrame): GameState =>
  assign(state, {
    cursor: {
      ...cursor,
      seatIdx: cursor.seatIdx + 1,
      slot: 0,
      pick: 0,
      picksTotal: -1,
    },
  });
