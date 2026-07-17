import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { actionStep } from './action-step';
import { draftStep } from './draft-step';

export const stepCursor = (state: GameState): GameState =>
  match(state.cursor)
    .with({ phase: 'draft' }, (cursor) => draftStep(state, cursor))
    .with({ phase: 'action' }, (cursor) => actionStep(state, cursor))
    .otherwise(() => state);
