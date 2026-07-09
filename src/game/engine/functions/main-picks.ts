import type { Player } from '@/game/types';

import { singularityTotal } from './singularity-total';

// Main planet drafts 2 cards, +1 per total Singularity level across owned planets.
export function mainPicks(p: Player): number {
  return 2 + singularityTotal(p);
}
