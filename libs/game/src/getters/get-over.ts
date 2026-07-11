import type { GameOver } from '../interfaces/game-over';
import { getGameState } from '../game-state';

export function getOver(): GameOver | null {
  return getGameState().over;
}
