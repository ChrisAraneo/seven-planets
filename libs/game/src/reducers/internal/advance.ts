import { match } from 'ts-pattern';

import type { GameState } from '../../interfaces/game-state';
import { finishGame } from './finish-game';
import { isSettled } from './is-settled';
import { stepCursor } from './step-cursor';

export const advance = (state: GameState): GameState =>
  match(state)
    .when(isSettled, () => state)
    .when(() => state.over !== null, finishGame)
    .otherwise(() => advance(stepCursor(state)));
