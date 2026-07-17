import { getGameStateLastValue } from '../get-game-state-last-value';

export const getAwaitingAction = (): boolean =>
  getGameStateLastValue().isAwaitingAction;
