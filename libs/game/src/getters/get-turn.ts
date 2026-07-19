import { getGameStateLastValue } from '../get-game-state-last-value';

export const getTurn = (): number => getGameStateLastValue().turn;
