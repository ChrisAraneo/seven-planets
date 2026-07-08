import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { singularityTotal } from './singularity-total';

// Main planet drafts 2 cards, +1 per total Singularity level across owned planets.
export function mainPicks(p: Player): number {
  const state = getGameState();
  return 2 + singularityTotal(p);
}
