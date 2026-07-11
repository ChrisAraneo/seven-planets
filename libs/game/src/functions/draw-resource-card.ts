import { RESOURCE_TYPES } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { PoolType } from '../interfaces/pool-type';

import { weightedDraw } from './weighted-draw';

// Draw one resource card weighted by card weight (Spice excluded — Harvester only).
export function drawResourceCard(state: GameState): PoolType {
  return weightedDraw(
    RESOURCE_TYPES.filter((t) => t !== 'SPICE'),
    'ORE',
  );
}
