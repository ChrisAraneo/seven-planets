import { assign } from 'lodash-es';

import type { GameState } from '../../../interfaces/game-state';
import { chain } from '../../../utils/chain';

export const transferCards = (
  state: GameState,
  fromId: number,
  toId: number,
  type: string,
  amount: number,
): void =>
  void chain(state)
    .tap(() =>
      assign(state.players[fromId].hand, {
        [type]: state.players[fromId].hand[type] - amount,
      }),
    )
    .tap(() =>
      assign(state.players[toId].hand, {
        [type]: state.players[toId].hand[type] + amount,
      }),
    )
    .value();
