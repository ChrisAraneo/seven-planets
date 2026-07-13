import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { getTechLevel } from './get-tech-level';
import { turnOrder } from './turn-order';

// Draft priority: higher TECHNOLOGY drafts first. Ties keep the rotation order.
export function draftOrder(state: GameState): Player[] {
  return turnOrder(state).sort(
    (player, eachPlayer) =>
      getTechLevel(state, eachPlayer) - getTechLevel(state, player),
  );
}
