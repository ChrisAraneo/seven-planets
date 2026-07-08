import type { GameState } from '@/game/types';
import { getHumanResolve, setHumanResolve } from './resolver-state';

export function humanActionTurn(state: GameState): Promise<void> {
  return new Promise((res) => {
    setHumanResolve(res);
    state.awaitingAction = true;
  });
}
