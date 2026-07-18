import { assign } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import { getD1Cursor } from './get-done-cursor';

export const finishGame = (state: GameState): GameState =>
  assign(state, {
    isAwaitingPick: false,
    isAwaitingAction: false,
    activeId: -1,
    cursor: getD1Cursor(),
  });
