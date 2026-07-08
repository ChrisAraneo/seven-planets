import type { GameState } from '@/game/types';
import { alivePlayers } from './alive-players';
import { AUTO_HUMAN } from './auto-human';
import { triggerGameOver } from './trigger-game-over';

export function checkWin(state: GameState): void {
  if (state.over) {
    return;
  }
  const alive = alivePlayers(state);
  if (alive.length === 1) {
    triggerGameOver(state, alive[0], 'conquest');
    return;
  }
  if (!AUTO_HUMAN && !state.players[0].alive) {
    triggerGameOver(state, null, 'eliminated');
  }
}
