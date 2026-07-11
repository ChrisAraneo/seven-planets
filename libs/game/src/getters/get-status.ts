import { getGameState } from '../game-state';

export function getStatus(): string {
  return getGameState().status;
}
