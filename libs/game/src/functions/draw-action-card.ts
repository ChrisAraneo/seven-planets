import type { GameState } from '../interfaces/game-state';
import type { PoolType } from '../interfaces/pool-type';
import { getDrawableActionTypes } from './get-drawable-action-types';
import { weightedDraw } from './weighted-draw';

export const drawActionCard = (state: GameState): PoolType =>
  weightedDraw(getDrawableActionTypes(state), 'ATTACK');
