import { chain, range } from 'lodash-es';
import { getStartIdx } from '../getters/get-start-idx';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export function turnOrder(state: GameState): Player[] {
  return chain(range(state.players.length))
    .map(
      (offset) =>
        state.players[(getStartIdx() + offset) % state.players.length],
    )
    .filter((player) => player.isAlive)
    .value();
}
