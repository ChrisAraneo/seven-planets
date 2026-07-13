import type { GameOver } from '../interfaces/game-over';
import { getGameStateLastValue } from '../state';

export function getGameOverObject(): GameOver | undefined {
  return getGameStateLastValue().over?.winner
    ? (getGameStateLastValue().over ?? undefined)
    : undefined;
}
