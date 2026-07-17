import type { GameOver } from '../interfaces/game-over';
import { getGameStateLastValue } from '../state';

export function getGameOverObject(): GameOver | null {
  return getGameStateLastValue().over?.winner
    ? getGameStateLastValue().over
    : null;
}
