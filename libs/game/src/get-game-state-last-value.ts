import type { GameState } from './interfaces/game-state';
import { stateSubject } from './state';

export const getGameStateLastValue = (): GameState => stateSubject.getValue();
