import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { endGame } from './end-game';
import { getPlayerByIndex } from './extractors/get-player-by-index';

export type GameOverReason = 'CONQUEST' | 'ELIMINATED';

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
    .otherwise(() => endGame(state, getPlayerByIndex(state, winnerId), reason));
