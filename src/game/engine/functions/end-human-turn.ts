import { getState } from '../state';
import { getHumanResolve, setHumanResolve } from './resolver-state';

export function endHumanTurn(): void {
  const r = getHumanResolve();
  if (!r) {
    return;
  }
  setHumanResolve(null);
  getState().awaitingAction = false;
  r();
}
