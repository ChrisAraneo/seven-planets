import { getGameStateLastValue } from '../get-game-state-last-value';

export const getActiveId = (): number => getGameStateLastValue().activeId;
