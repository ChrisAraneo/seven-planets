// NOTE: This function is not used anywhere in the current codebase.
// The store implements the same logic as a Vue computed property instead.
import { getState } from '../state';
import { getHumanResolve } from './resolver-state';

export function isHumanTurn(): boolean {
  return getHumanResolve() !== null && !getState().busy && !getState().over;
}
