import { getHumanResolve, setHumanResolve } from './resolver-state';
import type { GameState } from '../interfaces/game-state';

export function humanActionTurn(state: GameState): Promise<void> {
  return new Promise((res) => {
    setHumanResolve(res);
    state.awaitingAction = true;
  });
}
