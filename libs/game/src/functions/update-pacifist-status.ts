import type { GameState } from '../interfaces/game-state';
import { promoteIfVowKept } from './promote-if-vow-kept';

export const updatePacifistStatus = (state: GameState): GameState =>
  state.players.reduce(
    (eachState, player) => promoteIfVowKept(eachState, player, state.turn),
    state,
  );
