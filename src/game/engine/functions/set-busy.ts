import type { GameState } from '@/game/types';

export function setBusy(state: GameState, v: boolean): void {
  state.busy = v;
}
