import { RESOURCE_TYPES } from '../config/constants';
import type { PoolType } from '../interfaces/pool-type';
import { weightedDraw } from './weighted-draw';

// Draw one resource card weighted by card weight (Spice excluded — Harvester only).
export function drawResourceCard(): PoolType {
  return weightedDraw(
    RESOURCE_TYPES.filter((resourceType) => resourceType !== 'SPICE'),
    'ORE',
  );
}
