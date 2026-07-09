import { getGameState } from '@/stores/game-state';

export function setStatus(msg: string): void {
  const state = getGameState();
  state.status = msg;
}
