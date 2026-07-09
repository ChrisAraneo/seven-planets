import { filterAlivePlayers } from './filter-alive-players';
import { AUTO_HUMAN } from './auto-human';
import { triggerGameOver } from './trigger-game-over';
import type { GameState } from '@/game/types';

export function checkWin(state: GameState): void {
  if (state.over) {
    return;
  }

  const alivePlayers = filterAlivePlayers(state);

  if (alivePlayers.length === 1) {
    triggerGameOver(alivePlayers[0], 'conquest');

    return;
  }

  if (!AUTO_HUMAN && !state.players[0].alive) {
    triggerGameOver(null, 'eliminated');
  }
}
