import { cloneDeep } from 'lodash-es';

import { getGameState } from '../game-state';

export function getDraftPlanetId(): number {
  return Object.freeze(cloneDeep(getGameState().draftPlanetId));
}
