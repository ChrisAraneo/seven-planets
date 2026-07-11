import type { PoolType } from '../interfaces/pool-type';
import { getGameState } from '../game-state';

export function getPool(): readonly PoolType[] {
  return getGameState().pool;
}
