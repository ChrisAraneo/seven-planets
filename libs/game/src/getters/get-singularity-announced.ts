import { getGameState } from '../state';

export function getSingularityAnnounced(): boolean {
  return getGameState().singularityAnnounced;
}
