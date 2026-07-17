import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { isQueueExhausted } from './is-queue-exhausted';
import { isSeatSittingOut } from './is-seat-sitting-out';
import { parkAction } from './park-action';
import type { ActionCursor } from './seat-frame';
import { skipSeat } from './skip-seat';
import { startNextTurn } from './start-next-turn';

export const actionStep = (state: GameState, cursor: ActionCursor): GameState =>
  match({ state, cursor })
    .when(isQueueExhausted, () => startNextTurn(state))
    .when(isSeatSittingOut, skipSeat)
    .otherwise(parkAction);
