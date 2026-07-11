import { getGameState } from '../game-state';

export function getBusy(): boolean {
  return getGameState().busy;
}
