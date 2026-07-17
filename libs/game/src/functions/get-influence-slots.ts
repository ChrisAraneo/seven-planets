import { match } from 'ts-pattern';

import {
  INFLUENCE_CARDS_FROM_TURN,
  INFLUENCE_TYPES,
} from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { PoolType } from '../interfaces/pool-type';
import { choice } from './choice';

export const getInfluenceSlots = (state: GameState): PoolType[] =>
  match(state.turn)
    .when(
      (turn) => turn >= INFLUENCE_CARDS_FROM_TURN,
      (): PoolType[] =>
        Array.from({ length: 2 }, () => choice(INFLUENCE_TYPES)),
    )
    .otherwise((): PoolType[] => []);
