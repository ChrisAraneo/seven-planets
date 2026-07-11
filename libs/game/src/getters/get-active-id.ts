import { getGameState } from '../game-state';

export function getActiveId(): number {
  return getGameState().activeId;
}
