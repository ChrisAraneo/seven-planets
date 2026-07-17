import { getGameStateLastValue } from '../get-game-state-last-value';
import type { GameOver } from '../interfaces/game-over';

export const getGameOverObject = (): GameOver | null =>
  (getGameStateLastValue().over?.winner ? getGameStateLastValue().over : null);
