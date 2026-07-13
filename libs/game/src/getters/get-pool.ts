import type { PoolType } from '../interfaces/pool-type';
import { getGameStateLastValue } from '../state';

export function getPool(): readonly PoolType[] {
  return getGameStateLastValue().pool;
}
