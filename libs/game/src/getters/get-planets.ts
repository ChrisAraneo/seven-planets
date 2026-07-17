import { getGameStateLastValue } from '../get-game-state-last-value';
import type { Planet } from '../interfaces/planet';

export const getPlanets = (): readonly Planet[] =>
  getGameStateLastValue().planets;
