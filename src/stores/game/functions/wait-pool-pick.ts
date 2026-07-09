import {
  getPoolResolve,
  setPoolResolve,
} from '@/stores/game/functions/resolver-state';
import type { GameState } from '@/game/types';

/** Park until the seat in play answers with the `pick` store action —
    a human click and the AI agent resolve this the exact same way. */
export function waitPoolPick(state: GameState): Promise<number> {
  return new Promise((res) => {
    setPoolResolve(res);
    state.awaitingPick = true;
  });
}
