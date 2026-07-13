import type { GameOver } from '../interfaces/game-over';
import { getGameStateLastValue } from '../state';

export function getOver(): GameOver | null {
  return getGameStateLastValue().over;
}
