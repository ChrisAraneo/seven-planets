import { getState } from '../state';
import { getHumanResolve, setHumanResolve } from './resolver-state';

export function humanActionTurn(): Promise<void> {
  return new Promise((res) => {
    setHumanResolve(res);
    getState().awaitingAction = true;
  });
}
