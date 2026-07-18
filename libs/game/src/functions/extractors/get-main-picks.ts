import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';
import { computeSingularityTotal } from '../compute-singularity-total';

// TODO: OK
const BASE_MAIN_PICKS = 2;

export const getMainPicks = (state: GameState, player: Player): number =>
  BASE_MAIN_PICKS + computeSingularityTotal(state, player);
