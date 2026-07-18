import { assign } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import { getActionCursor } from './get-action-cursor';

export const beginActionPhase = (state: GameState): GameState =>
  assign(state, { phase: 'ACTION', cursor: getActionCursor(state) });
