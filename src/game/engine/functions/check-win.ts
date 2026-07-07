import { getState } from '../state';
import { alivePlayers } from './alive-players';
import { AUTO_HUMAN } from './auto-human';
import { triggerGameOver } from './trigger-game-over';

export function checkWin(): void {
  if (getState().over) {
    return;
  }
  const alive = alivePlayers();
  if (alive.length === 1) {
    triggerGameOver(alive[0], 'conquest');
    return;
  }
  if (!AUTO_HUMAN && !getState().players[0].alive) {
    triggerGameOver(null, 'eliminated');
  }
}
