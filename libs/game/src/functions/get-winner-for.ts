import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export const getWinnerFor = (
  state: GameState,
  winnerId: number | null,
): Player | null =>
  match(winnerId)
    .with(null, (): Player | null => null)
    .otherwise((id) => state.players[id]);
