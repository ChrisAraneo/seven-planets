import { getGameState } from '@/stores/game-state';

export function log(msg: string, cls = 'sys'): void {
  const entries = getGameState().log;
  entries.push({ msg, cls });
  while (entries.length > 250) {
    entries.shift();
  }
}
