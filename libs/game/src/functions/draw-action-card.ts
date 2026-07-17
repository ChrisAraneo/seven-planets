import { match } from 'ts-pattern';

import { MOVE_CARDS_FROM_TURN } from '../config/constants';
import type { ActionType } from '../interfaces/action-type';
import type { GameState } from '../interfaces/game-state';
import type { PoolType } from '../interfaces/pool-type';
import { weightedDraw } from './weighted-draw';

export function drawActionCard(state: GameState): PoolType {
  return weightedDraw(getDrawableActionTypes(state), 'ATTACK');
}

function getDrawableActionTypes(state: GameState): ActionType[] {
  return match(state.turn)
    .when(
      (turn) => turn >= MOVE_CARDS_FROM_TURN,
      (): ActionType[] => ['ATTACK', 'RECRUIT', 'TRADE', 'MOVE'],
    )
    .otherwise((): ActionType[] => ['ATTACK', 'RECRUIT', 'TRADE']);
}
