import { assign } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import { getDoneCursor } from './get-done-cursor';

export const finishGame = (state: GameState): GameState =>
  assign(state, {
    isAwaitingPick: false,
    isAwaitingAction: false,
    activeId: -1,
    cursor: getDoneCursor(),
  });
