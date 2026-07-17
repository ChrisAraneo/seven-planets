import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { computeSingularityTotal } from './compute-singularity-total';

export function getMainPicks(state: GameState, player: Player): number {
  return 2 + computeSingularityTotal(state, player);
}
