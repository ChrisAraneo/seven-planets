import { getGameStateLastValue } from '../state';

export function getAwaitingAction(): boolean {
  return getGameStateLastValue().isAwaitingAction;
}
