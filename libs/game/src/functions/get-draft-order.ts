import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { getTechLevel } from './get-tech-level';
import { getTurnOrder } from './get-turn-order';

// Draft priority: higher TECHNOLOGY drafts first. Ties keep the rotation order.
export function getDraftOrder(state: GameState): Player[] {
  return getTurnOrder(state).toSorted(
    (player, eachPlayer) =>
      getTechLevel(state, eachPlayer) - getTechLevel(state, player),
  );
}
