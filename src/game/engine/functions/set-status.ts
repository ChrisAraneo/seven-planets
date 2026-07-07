import { getState } from '../state';

export function setStatus(msg: string): void {
  getState().status = msg;
}
