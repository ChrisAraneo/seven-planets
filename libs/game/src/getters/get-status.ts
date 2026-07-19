import { getGameStateLastValue } from '../get-game-state-last-value';

export const getStatus = (): string => getGameStateLastValue().status;
