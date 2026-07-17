import { getGameStateLastValue } from '../get-game-state-last-value';

export const getDraftPlanetId = (): number =>
  getGameStateLastValue().draftPlanetId;
