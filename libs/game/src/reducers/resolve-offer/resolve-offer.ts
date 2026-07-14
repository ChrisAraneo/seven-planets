import { assign, cloneDeep } from 'lodash-es';
import { chain } from '../../utils/chain';
import { match, P } from 'ts-pattern';

import { fmtCards } from '../../config/constants';
import { log } from '../../functions/log';
import { spendActionCard } from '../../functions/spend-action-card';
import type { Cost } from '../../interfaces/cost';
import type { GameState } from '../../interfaces/game-state';
import type { PendingOffer } from '../../interfaces/pending-offer';
import type { ResolveOfferPayload } from '../../actions/resolve-offer/resolve-offer';

const { nullish } = P;

/* Reducer branch. The target seat of pendingOffer accepts or declines it:
   executes the trade when accepted, logs the decline otherwise, then clears
   the flag — all on a private clone. Illegal intents reduce to the
   unchanged state. */
export function applyResolveOffer(
  state: GameState,
  payload: ResolveOfferPayload,
): GameState {
  return match(state.pendingOffer)
    .with(nullish, () => state)
    .when(
      (offer) => offer.toId !== payload.playerId,
      () => state,
    )
    .otherwise((offer) =>
      chain(cloneDeep(state))
        .thru((clone) => assign(clone, { pendingOffer: null }))
        .thru((clone) => applyDecision(clone, offer, payload.accept))
        .value(),
    );
}

function applyDecision(
  state: GameState,
  offer: PendingOffer,
  accept: boolean,
): GameState {
  return match(accept)
    .with(true, () =>
      execTrade(state, offer.fromId, offer.toId, offer.gives, offer.gets),
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
}

function execTrade(
  state: GameState,
  aId: number,
  bId: number,
  aGives: Cost,
  bGives: Cost,
): GameState {
  return chain(assign(state, spendActionCard(state, aId, 'TRADE')))
    .tap((state) =>
      Object.entries(aGives).forEach(([type, amount]) =>
        transferCards(state, aId, bId, type, amount),
      ),
    )
    .tap((state) =>
      Object.entries(bGives).forEach(([type, amount]) =>
        transferCards(state, bId, aId, type, amount),
      ),
    )
    .tap((state) =>
      assign(state.players[aId], {
        influence: state.players[aId].influence + 1,
      }),
    )
    .thru((state) =>
      assign(
        state,
        log(
          state,
          `🔁 ${state.players[aId].name} trades ${fmtCards(aGives)} to ${state.players[bId].name} for ${fmtCards(bGives)}  [+1⭐ influence]`,
          'trade',
        ),
      ),
    )
    .value();
}

function transferCards(
  state: GameState,
  fromId: number,
  toId: number,
  type: string,
  amount: number,
): void {
  return void chain(state)
    .tap((state) =>
      assign(state.players[fromId].hand, {
        [type]: state.players[fromId].hand[type] - amount,
      }),
    )
    .tap((state) =>
      assign(state.players[toId].hand, {
        [type]: state.players[toId].hand[type] + amount,
      }),
    )
    .value();
}
