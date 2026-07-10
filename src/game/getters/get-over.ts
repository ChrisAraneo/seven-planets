import { cloneDeep } from 'lodash-es';

import type { GameOver } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function getOver(): GameOver | null {
  return Object.freeze(cloneDeep(getGameState().over));
}
