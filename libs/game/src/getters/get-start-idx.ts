import { getGameState } from '../game-state';

export function getStartIdx(): number {
  return getGameState().startIdx;
}
