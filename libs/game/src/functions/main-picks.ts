import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

import { singularityTotal } from './singularity-total';

// Main planet drafts 2 cards, +1 per total Singularity level across owned planets.
export function mainPicks(state: GameState, player: Player): number {
  return 2 + singularityTotal(state, player);
}
