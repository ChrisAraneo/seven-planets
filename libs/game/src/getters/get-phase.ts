import type { Phase } from '../interfaces/phase';
import { getGameState } from '../game-state';

export function getPhase(): Phase {
  return getGameState().phase;
}
