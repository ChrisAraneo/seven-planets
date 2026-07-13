import type { Phase } from '../interfaces/phase';
import { getGameStateLastValue } from '../state';

export function getPhase(): Phase {
  return getGameStateLastValue().phase;
}
