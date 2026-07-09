import type { GameState, Player } from '@/game/types';

import { singularityTotal } from './singularity-total';

// Main planet drafts 2 cards, +1 per total Singularity level across owned planets.
export function mainPicks(state: GameState, p: Player): number {
  return 2 + singularityTotal(state, p);
}
