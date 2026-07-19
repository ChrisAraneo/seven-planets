import { getGameStateLastValue } from '../get-game-state-last-value';
import type { Phase } from '../interfaces/phase';

export const getPhase = (): Phase => getGameStateLastValue().phase;
