import { range } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';

export function getTurnOrder(state: GameState): Player[] {
  return chain(range(state.players.length))
    .map(
      (offset) =>
        state.players[(state.startIdx + offset) % state.players.length],
    )
    .filter((player) => player.isAlive)
    .value();
}
