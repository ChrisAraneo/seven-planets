import { assign } from 'lodash-es';

import { formatCards } from '../../functions/format-cards';
import { log } from '../../functions/log';
import { spendActionCard } from '../../functions/spend-action-card';
import type { Cost } from '../../interfaces/cost';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { transferCards } from './transfer-cards';

const TRADE_INFLUENCE_BONUS = 1;
export const execTrade = (
  state: GameState,
  aId: number,
  bId: number,
  aGives: Cost,
  bGives: Cost,
): GameState =>
  chain(assign(state, spendActionCard(state, aId, 'TRADE')))
    .tap(() =>
      Object.entries(aGives).forEach(([type, amount]) =>
        transferCards(state, aId, bId, type, amount),
      ),
    )
    .tap(() =>
      Object.entries(bGives).forEach(([type, amount]) =>
        transferCards(state, bId, aId, type, amount),
      ),
    )
    .tap(() =>
      assign(state.players[aId], {
        influence: state.players[aId].influence + TRADE_INFLUENCE_BONUS,
      }),
    )
    .thru(() =>
      assign(
        state,
        log(
          state,
          `🔁 ${state.players[aId].name} trades ${formatCards(aGives)} to ${state.players[bId].name} for ${formatCards(bGives)}  [+1⭐ influence]`,
          'trade',
        ),
      ),
    )
    .value();
