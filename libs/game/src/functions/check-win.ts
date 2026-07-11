import { filterAlivePlayers } from './filter-alive-players';
import { AUTO_HUMAN } from './auto-human';
import { triggerGameOver } from './trigger-game-over';
import type { GameState } from '../interfaces/game-state';

export function checkWin(state: GameState): GameState {
  if (state.over) {
    return state;
  }

  const alivePlayers = filterAlivePlayers(state);

  if (alivePlayers.length === 1) {
    return triggerGameOver(state, alivePlayers[0].id, 'conquest');
  }

  if (!AUTO_HUMAN && !state.players[0].alive) {
    return triggerGameOver(state, null, 'eliminated');
  }

  return state;
}
