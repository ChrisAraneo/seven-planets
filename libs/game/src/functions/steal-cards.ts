import { range } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import type { Hand } from '../interfaces/hand';
import { chain } from '../utils/chain';
import { steal1 } from './steal-one';
import { updatePlayer } from './update-player';

export interface LootProgress {
  fromHand: Hand;
  toHand: Hand;
  taken: Hand;
}

export const stealCards = (
  state: GameState,
  fromId: number,
  toId: number,
  number: number,
): { state: GameState; taken: Hand } =>
  chain(range(number))
    .reduce((loot: LootProgress) => steal1(loot), {
      fromHand: { ...state.players[fromId].hand },
      toHand: { ...state.players[toId].hand },
      taken: {},
    })
    .thru(({ fromHand, toHand, taken }) => ({
      state: updatePlayer(
        updatePlayer(state, fromId, (player) => ({
          ...player,
          hand: fromHand,
        })),
        toId,
        (player) => ({ ...player, hand: toHand }),
      ),
      taken,
    }))
    .value();
