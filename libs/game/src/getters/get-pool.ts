import { cloneDeep } from 'lodash-es';

import type { PoolType } from '../interfaces/pool-type';
import { getGameState } from '../game-state';

export function getPool(): readonly PoolType[] {
  return Object.freeze(cloneDeep(getGameState().pool));
}
