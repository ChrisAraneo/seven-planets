import { cloneDeep } from 'lodash-es';

import type { GameOver } from '../interfaces/game-over';
import { getGameState } from '../game-state';

export function getOver(): GameOver | null {
  return Object.freeze(cloneDeep(getGameState().over));
}
