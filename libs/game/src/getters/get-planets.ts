import type { Planet } from '../interfaces/planet';
import { getGameStateLastValue } from '../state';

export function getPlanets(): readonly Planet[] {
  return getGameStateLastValue().planets;
}
