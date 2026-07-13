import { getGameStateLastValue } from '../state';

export function getActiveId(): number {
  return getGameStateLastValue().activeId;
}
