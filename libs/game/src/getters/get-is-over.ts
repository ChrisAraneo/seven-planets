import { getGameStateLastValue } from '../get-game-state-last-value';

export const getIsOver = (): boolean =>
  Boolean(getGameStateLastValue().over?.winner);
