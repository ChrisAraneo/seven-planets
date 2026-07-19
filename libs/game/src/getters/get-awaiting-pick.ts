import { getGameStateLastValue } from '../get-game-state-last-value';

export const getAwaitingPick = (): boolean =>
  getGameStateLastValue().isAwaitingPick;
