import { assign } from 'lodash-es';

import type { GameState } from '../../interfaces/game-state';
import type { ActionFrame } from './seat-frame';

export const skipSeat = ({ state, cursor }: ActionFrame): GameState =>
  assign(state, {
    cursor: { ...cursor, seatIdx: cursor.seatIdx + 1 },
  });
