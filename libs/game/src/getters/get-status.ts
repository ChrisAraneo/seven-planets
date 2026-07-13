import { getGameState } from '../state';

export function getStatus(): string {
  return getGameState().status;
}
