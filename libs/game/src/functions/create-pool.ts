import { match } from 'ts-pattern';

import { BUILDINGS_FROM_TURN } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { PoolType } from '../interfaces/pool-type';
import { createMidGamePool } from './create-mid-game-pool';
import { drawResourceCard } from './draw-resource-card';

// TODO: 14 -- move to consts?
export const createPool = (state: GameState): PoolType[] =>
  match(state.turn)
    .when(
      (turn) => turn < BUILDINGS_FROM_TURN,
      (): PoolType[] => Array.from({ length: 14 }, () => drawResourceCard()),
    )
    .otherwise(() => createMidGamePool(state));
