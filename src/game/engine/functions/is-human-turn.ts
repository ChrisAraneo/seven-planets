import { getState } from '../state';
import { getHumanResolve } from './resolver-state';

export function isHumanTurn(): boolean {
  return getHumanResolve() !== null && !getState().busy && !getState().over;
}
