import {
  getHumanResolve,
  setHumanResolve,
} from '@/stores/game/functions/resolver-state';
import type { GameState } from '@/game/types';

export function humanActionTurn(state: GameState): Promise<void> {
  return new Promise((res) => {
    setHumanResolve(res);
    state.awaitingAction = true;
  });
}
