import type { GameState } from '@/game/types';

export function log(state: GameState, msg: string, cls = 'sys'): void {
  state.log.push({ msg, cls });
  while (state.log.length > 250) {
    state.log.shift();
  }
}
