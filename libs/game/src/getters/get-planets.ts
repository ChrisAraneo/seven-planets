import type { Planet } from '../interfaces/planet';
import { getGameState } from '../state';

export function getPlanets(): readonly Planet[] {
  return getGameState().planets;
}
