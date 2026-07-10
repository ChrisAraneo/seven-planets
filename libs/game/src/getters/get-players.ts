import { cloneDeep } from 'lodash-es';

import type { Player } from '../interfaces/player';
import { getGameState } from '../game-state';

export function getPlayers(): readonly Player[] {
  return Object.freeze(cloneDeep(getGameState().players));
}
