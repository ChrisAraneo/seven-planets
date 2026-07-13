import type { PoolType } from '../interfaces/pool-type';
import { getGameState } from '../state';

export function getPool(): readonly PoolType[] {
  return getGameState().pool;
}
