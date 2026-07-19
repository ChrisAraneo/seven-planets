import type { Action } from './actions/action';
import { ACTION_SUBJECT } from './state';

export const dispatch = (action: Action): void => {
  ACTION_SUBJECT.next(action);
};
