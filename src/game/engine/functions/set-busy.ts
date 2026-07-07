import { getState } from '../state';

export function setBusy(v: boolean): void {
  getState().busy = v;
}
