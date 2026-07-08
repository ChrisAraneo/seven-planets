import type { GameState } from '@/game/types';
import { getPoolResolve, setPoolResolve } from './resolver-state';

export function waitHumanPoolPick(state: GameState): Promise<number> {
  return new Promise((res) => {
    setPoolResolve(res);
    state.awaitingPick = true;
  });
}
