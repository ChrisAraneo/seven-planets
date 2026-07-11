import { getGameState } from '../game-state';

export function getSingularityAnnounced(): boolean {
  return getGameState().singularityAnnounced;
}
