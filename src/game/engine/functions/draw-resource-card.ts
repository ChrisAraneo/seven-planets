import { CARDS, RESOURCE_TYPES } from '@/game/constants';
import type { PoolType } from '@/game/types';

// Draw one resource card weighted by card weight (Spice excluded — Harvester only).
export function drawResourceCard(): PoolType {
  const types = RESOURCE_TYPES.filter((t) => t !== 'SPICE');
  let total = 0;
  for (const t of types) {
    total += CARDS[t].weight;
  }
  let r = Math.random() * total;
  for (const t of types) {
    r -= CARDS[t].weight;
    if (r < 0) {
      return t;
    }
  }
  return 'ORE';
}
