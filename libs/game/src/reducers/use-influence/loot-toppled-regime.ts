import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import { formatCards } from '../../functions/format-cards';
import { getHandSize } from '../../functions/get-hand-size';
import { log } from '../../functions/log';
import { stealCards } from '../../functions/steal-cards';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';

const TOPPLE_LOOT_CAP = 6;
export const lootToppledRegime = (
  state: GameState,
  playerId: number,
  defId: number,
): void =>
  match(Math.min(TOPPLE_LOOT_CAP, getHandSize(state.players[defId])))
    .when((lootN) => lootN <= 0, noop)
    .otherwise(
      (lootN) =>
        void chain(stealCards(state, defId, playerId, lootN))
          .tap(({ state: looted }) => assign(state, looted))
          .tap(({ taken }) =>
            assign(
              state,
              log(
                state,
                `💰 ${state.players[playerId].name} salvages ${formatCards(taken)} from the toppled regime!`,
                'war',
              ),
            ),
          )
          .value(),
    );
