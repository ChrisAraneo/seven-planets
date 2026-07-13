import { getGameState } from '../state';

export function getActiveId(): number {
  return getGameState().activeId;
}
