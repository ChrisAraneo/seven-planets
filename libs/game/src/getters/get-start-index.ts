import { getGameStateLastValue } from '../get-game-state-last-value';

export const getStartIndex = (): number => getGameStateLastValue().startIdx;
