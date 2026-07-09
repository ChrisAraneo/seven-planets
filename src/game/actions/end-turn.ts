import {
  getHumanResolve,
  setHumanResolve,
} from '@/game/engine/functions/resolver-state';
import { getGameState } from '@/stores/game-state';

/* The `endTurn` store action: finish the human's action turn. It answers
   the engine's parked humanActionTurn(); agent-driven seats end their
   turn by returning false from act() instead. */
export function endTurn(payload: { playerId: number }): void {
  const state = getGameState();
  if (payload.playerId !== state.activeId) {
    return;
  }
  const resolve = getHumanResolve();
  if (!resolve) {
    return;
  }
  setHumanResolve(null);
  state.awaitingAction = false;
  resolve();
}
