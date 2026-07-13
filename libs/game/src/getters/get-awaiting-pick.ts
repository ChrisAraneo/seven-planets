import { getGameState } from '../state';

export function getAwaitingPick(): boolean {
  return getGameState().awaitingPick;
}
