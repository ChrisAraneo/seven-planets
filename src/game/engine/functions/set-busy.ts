import { getGameState } from '@/stores/game-state';

export function setBusy(v: boolean): void {
  const state = getGameState();
  state.busy = v;
}
