import { getGameStateLastValue } from '../state';

export function getAwaitingPick(): boolean {
  return getGameStateLastValue().isAwaitingPick;
}
