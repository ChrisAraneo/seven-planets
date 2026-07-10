import { cloneDeep } from 'lodash-es';

import type { Planet } from '../interfaces/planet';
import { getGameState } from '../game-state';

export function getPlanets(): readonly Planet[] {
  return Object.freeze(cloneDeep(getGameState().planets));
}
