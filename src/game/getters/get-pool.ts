import { cloneDeep } from 'lodash-es';

import type { PoolType } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function getPool(): readonly PoolType[] {
  return Object.freeze(cloneDeep(getGameState().pool));
}
