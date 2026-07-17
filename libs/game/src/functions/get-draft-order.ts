import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { getTechLevel } from './get-tech-level';
import { getTurnOrder } from './get-turn-order';

export const getDraftOrder = (state: GameState): Player[] =>
  getTurnOrder(state).toSorted(
    (player, eachPlayer) =>
      getTechLevel(state, eachPlayer) - getTechLevel(state, player),
  );
