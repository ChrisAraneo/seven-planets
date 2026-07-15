import { range } from 'lodash-es';
import { chain } from '../utils/chain';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

// Reads startIdx from ITS argument (never the live snapshot): the reducer
// calls this on private clones whose startIdx the prelude just rolled.
export function getTurnOrder(state: GameState): Player[] {
  return chain(range(state.players.length))
    .map(
      (offset) =>
        state.players[(state.startIdx + offset) % state.players.length],
    )
    .filter((player) => player.isAlive)
    .value();
}
