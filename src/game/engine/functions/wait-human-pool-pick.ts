import { getState } from '../state';
import { getPoolResolve, setPoolResolve } from './resolver-state';

export function waitHumanPoolPick(): Promise<number> {
  return new Promise((res) => {
    setPoolResolve(res);
    getState().awaitingPick = true;
  });
}
