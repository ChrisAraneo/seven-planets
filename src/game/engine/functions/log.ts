import type { Player } from '@/game/types';
import { getState } from '../state';

export function log(msg: string, cls = 'sys'): void {
  getState().log.push({ msg, cls });
  while (getState().log.length > 250) {
    getState().log.shift();
  }
}
