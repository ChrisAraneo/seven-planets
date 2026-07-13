import type { Phase } from '../interfaces/phase';
import { getGameState } from '../state';

export function getPhase(): Phase {
  return getGameState().phase;
}
