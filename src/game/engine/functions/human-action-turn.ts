import {
  getHumanResolve,
  setHumanResolve,
} from '@/game/actions/common/resolver-state';
import { getGameState } from '@/stores/game-state';

export function humanActionTurn(): Promise<void> {
  const state = getGameState();
  return new Promise((res) => {
    setHumanResolve(res);
    state.awaitingAction = true;
  });
}
