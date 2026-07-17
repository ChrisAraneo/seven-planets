import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { endGame } from './end-game';
import { getWinnerFor } from './get-winner-for';

export type GameOverReason = 'conquest' | 'eliminated';

export const triggerGameOver = (
  state: GameState,
  winnerId: number | null,
  reason: GameOverReason,
): GameState =>
  match(state)
    .when(
      () => Boolean(state.over),
      () => state,
    )
    .otherwise(() => endGame(state, getWinnerFor(state, winnerId), reason));
