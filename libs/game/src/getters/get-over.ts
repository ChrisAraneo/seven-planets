import type { GameOver } from '../interfaces/game-over';
import { getGameState } from '../state';

export function getOver(): GameOver | null {
  return getGameState().over;
}
