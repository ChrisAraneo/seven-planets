import { assign } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import type { DraftFrame } from './seat-frame';

export const nextSlot = ({ state, cursor }: DraftFrame): GameState =>
  assign(state, {
    cursor: {
      ...cursor,
      slot: cursor.slot + 1,
      pick: 0,
      picksTotal: -1,
    },
  });
