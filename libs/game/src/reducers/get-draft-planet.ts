import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';

export const getDraftPlanet = (state: GameState): Planet =>
  state.planets[state.draftPlanetId];
