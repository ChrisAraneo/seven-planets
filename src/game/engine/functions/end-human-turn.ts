import { getGameState } from '@/stores/game-state';

import { getHumanResolve, setHumanResolve } from './resolver-state';

export function endHumanTurn(): void {
  const state = getGameState();
  const r = getHumanResolve();
  if (!r) {
    return;
  }
  setHumanResolve(null);
  state.awaitingAction = false;
  r();
}
