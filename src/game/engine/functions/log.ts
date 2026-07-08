import { getGameState } from '@/stores/game-state';

export function log(msg: string, cls = 'sys'): void {
  const state = getGameState();
  state.log.push({ msg, cls });
  while (state.log.length > 250) {
    state.log.shift();
  }
}
