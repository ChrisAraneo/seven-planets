import type { GameState } from './interfaces/game-state';
import { STATE_SUBJECT } from './state';

export const getGameStateLastValue = (): GameState => STATE_SUBJECT.getValue();
