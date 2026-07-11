import { getGameState } from '../game-state';

export function getDraftPlanetId(): number {
  return getGameState().draftPlanetId;
}
