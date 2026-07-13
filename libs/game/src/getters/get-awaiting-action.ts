import { getGameState } from '../state';

export function getAwaitingAction(): boolean {
  return getGameState().awaitingAction;
}
