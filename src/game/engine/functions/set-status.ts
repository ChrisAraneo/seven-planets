import type { GameState } from '@/game/types';

export function setStatus(state: GameState, msg: string): void {
  state.status = msg;
}
