import {
  getPoolResolve,
  setPoolResolve,
} from '@/game/actions/common/resolver-state';
import { getGameState } from '@/stores/game-state';

/** Park until the seat in play answers with the `pick` store action —
    a human click and the AI agent resolve this the exact same way. */
export function waitPoolPick(): Promise<number> {
  const state = getGameState();
  return new Promise((res) => {
    setPoolResolve(res);
    state.awaitingPick = true;
  });
}
