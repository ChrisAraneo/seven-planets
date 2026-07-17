import { match } from 'ts-pattern';

import { MOVE_CARDS_FROM_TURN } from '../config/constants';
import type { ActionType } from '../interfaces/action-type';
import type { GameState } from '../interfaces/game-state';

export const getDrawableActionTypes = (state: GameState): ActionType[] =>
  match(state.turn)
    .when(
      (turn) => turn >= MOVE_CARDS_FROM_TURN,
      (): ActionType[] => ['ATTACK', 'RECRUIT', 'TRADE', 'MOVE'],
    )
    .otherwise((): ActionType[] => ['ATTACK', 'RECRUIT', 'TRADE']);
