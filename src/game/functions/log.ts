import type { GameState } from '@/game/types';

export function log(state: GameState, msg: string, cls = 'sys'): void {
  const entries = state.log;
  entries.push({ msg, cls });
  while (entries.length > 250) {
    entries.shift();
  }
}
