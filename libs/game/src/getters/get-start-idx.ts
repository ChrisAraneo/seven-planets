import { getGameState } from '../state';

export function getStartIdx(): number {
  return getGameState().startIdx;
}
