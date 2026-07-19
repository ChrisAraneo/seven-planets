import { RESOURCE_TYPES } from '../config/constants';
import type { PoolType } from '../interfaces/pool-type';
import { weightedDraw } from './weighted-draw';

export const drawResourceCard = (): PoolType =>
  weightedDraw(
    RESOURCE_TYPES.filter((resourceType) => resourceType !== 'SPICE'),
    'ORE',
  );
