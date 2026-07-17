import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import { log } from '../../functions/log';
import { stealCards } from '../../functions/steal-cards';
import type { GameState } from '../../interfaces/game-state';
import type { Hand } from '../../interfaces/hand';
import { chain } from '../../utils/chain';

export const lootCards = (
  state: GameState,
  fromId: number,
  toId: number,
  lootN: number,
  message: (taken: Hand) => string,
): void =>
  match(lootN)
    .when((count) => count <= 0, noop)
    .otherwise(
      (count) =>
        void chain(stealCards(state, fromId, toId, count))
          .tap(({ state: looted }) => assign(state, looted))
          .tap(({ taken }) => assign(state, log(state, message(taken), 'war')))
          .value(),
    );
