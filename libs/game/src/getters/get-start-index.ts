import { getGameStateLastValue } from '../state';

export function getStartIndex(): number {
  return getGameStateLastValue().startIdx;
}
