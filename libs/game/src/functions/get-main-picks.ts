import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { computeSingularityTotal } from './compute-singularity-total';

export const getMainPicks = (state: GameState, player: Player): number =>
  2 + computeSingularityTotal(state, player);
