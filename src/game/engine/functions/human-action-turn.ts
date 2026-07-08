import { getGameState } from '@/stores/game-state';

import { getHumanResolve, setHumanResolve } from './resolver-state';

export function humanActionTurn(): Promise<void> {
  const state = getGameState();
  return new Promise((res) => {
    setHumanResolve(res);
    state.awaitingAction = true;
  });
}
