import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { log } from '../../../functions/log';
import type { GameState } from '../../../interfaces/game-state';
import type { PendingOffer } from '../../../interfaces/pending-offer';
import { executeTrade } from './execute-trade';

export const applyDecision = (
  state: GameState,
  offer: PendingOffer,
  isAccepted: boolean,
): GameState =>
  match(isAccepted)
    .with(true, () =>
      executeTrade(state, offer.fromId, offer.toId, offer.gives, offer.gets),
    )
    .otherwise(() =>
      assign(
        state,
        log(
          state,
          `🔁 ${state.players[offer.toId].name} declines ${state.players[offer.fromId].name}'s trade offer.`,
          'trade',
        ),
      ),
    );
