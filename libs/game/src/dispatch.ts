import type { Action } from './actions/action';
import { actionSubject } from './state';

export const dispatch = (action: Action): void => {
  actionSubject.next(action);
};
