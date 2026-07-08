import { getGameState } from '@/stores/game-state';

import { alivePlayers } from './alive-players';
import { AUTO_HUMAN } from './auto-human';
import { triggerGameOver } from './trigger-game-over';

export function checkWin(): void {
  const state = getGameState();
  if (state.over) {
    return;
  }
  const alive = alivePlayers();
  if (alive.length === 1) {
    triggerGameOver(alive[0], 'conquest');
    return;
  }
  if (!AUTO_HUMAN && !state.players[0].alive) {
    triggerGameOver(null, 'eliminated');
  }
}
