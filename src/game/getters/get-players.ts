import { cloneDeep } from 'lodash-es';

import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function getPlayers(): readonly Player[] {
  return Object.freeze(cloneDeep(getGameState().players));
}
