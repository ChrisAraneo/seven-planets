import { cloneDeep } from 'lodash-es';

import type { Planet } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function getPlanets(): readonly Planet[] {
  return Object.freeze(cloneDeep(getGameState().planets));
}
