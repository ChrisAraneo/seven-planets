import { getGameStateLastValue } from '../state';

export function getStartIdx(): number {
  return getGameStateLastValue().startIdx;
}
