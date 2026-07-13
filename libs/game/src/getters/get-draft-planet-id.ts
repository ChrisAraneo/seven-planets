import { getGameStateLastValue } from '../state';

export function getDraftPlanetId(): number {
  return getGameStateLastValue().draftPlanetId;
}
