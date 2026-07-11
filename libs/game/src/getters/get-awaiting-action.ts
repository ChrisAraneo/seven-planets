import { getGameState } from '../game-state';

export function getAwaitingAction(): boolean {
  return getGameState().awaitingAction;
}
