import { range } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';

export const getTurnOrder = (state: GameState): Player[] =>
  chain(range(state.players.length))
    .map(
      (offset) =>
        state.players[(state.startIdx + offset) % state.players.length],
    )
    .filter((player) => player.isAlive)
    .value();
