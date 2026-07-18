import { assign } from 'lodash-es';

import { PICKS_TOTAL_UNSET } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { DraftFrame } from './seat-frame';

export const nextSlot = ({ state, cursor }: DraftFrame): GameState =>
  assign(state, {
    cursor: {
      ...cursor,
      slot: cursor.slot + 1,
      pick: 0,
      picksTotal: PICKS_TOTAL_UNSET,
    },
  });
