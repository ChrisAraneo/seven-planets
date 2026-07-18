import { match } from 'ts-pattern';

import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';

// TODO: OK
export const getPlayerByIndex = (
  state: GameState,
  index: number | null,
): Player | null =>
  match(index)
    .with(null, () => null)
    .otherwise((id) => state.players[id]);
