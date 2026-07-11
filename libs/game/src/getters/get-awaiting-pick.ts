import { getGameState } from '../game-state';

export function getAwaitingPick(): boolean {
  return getGameState().awaitingPick;
}
