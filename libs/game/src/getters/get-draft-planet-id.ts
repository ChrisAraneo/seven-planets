import { getGameState } from '../state';

export function getDraftPlanetId(): number {
  return getGameState().draftPlanetId;
}
