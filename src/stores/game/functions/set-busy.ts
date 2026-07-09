import type { GameState } from '@/game/types';

export function setBusy(state: GameState, value: boolean): void {
  state.busy = value;
}
