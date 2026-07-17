import { RESOURCE_TYPES } from '../config/constants';
import type { PoolType } from '../interfaces/pool-type';
import { weightedDraw } from './weighted-draw';

export function drawResourceCard(): PoolType {
  return weightedDraw(
    RESOURCE_TYPES.filter((resourceType) => resourceType !== 'SPICE'),
    'ORE',
  );
}
