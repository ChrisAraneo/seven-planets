import { getGameStateLastValue } from '../state';

export function getSingularityAnnounced(): boolean {
  return getGameStateLastValue().singularityAnnounced;
}
