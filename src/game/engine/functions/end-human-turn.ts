import type { GameState } from '@/game/types';
import { getHumanResolve, setHumanResolve } from './resolver-state';

export function endHumanTurn(state: GameState): void {
  const r = getHumanResolve();
  if (!r) {
    return;
  }
  setHumanResolve(null);
  state.awaitingAction = false;
  r();
}
