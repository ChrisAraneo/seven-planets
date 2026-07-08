import { getGameState } from '@/stores/game-state';

import { getPoolResolve, setPoolResolve } from './resolver-state';

export function waitHumanPoolPick(): Promise<number> {
  const state = getGameState();
  return new Promise((res) => {
    setPoolResolve(res);
    state.awaitingPick = true;
  });
}
