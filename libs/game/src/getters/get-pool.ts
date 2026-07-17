import { getGameStateLastValue } from '../get-game-state-last-value';
import type { PoolType } from '../interfaces/pool-type';

export const getPool = (): readonly PoolType[] => getGameStateLastValue().pool;
