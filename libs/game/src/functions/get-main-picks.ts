import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { computeSingularityTotal } from './compute-singularity-total';

// Main planet drafts 2 cards, +1 per total Singularity level across owned planets.
export function getMainPicks(state: GameState, player: Player): number {
  return 2 + computeSingularityTotal(state, player);
}
