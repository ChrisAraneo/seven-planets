import { chain, cloneDeep, noop } from 'lodash-es';
import { match, P } from 'ts-pattern';
import { getGameState, setGameState } from '../game-state';

import { fmtCards } from '../config/constants';
import { log } from '../functions/log';
import { spendActionCard } from '../functions/spend-action-card';
import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';
import type { PendingOffer } from '../interfaces/pending-offer';

const { nullish } = P;

export interface ResolveOfferPayload {
  playerId: number;
  accept: boolean;
}

/* The target seat of pendingOffer accepts or declines it. Executes the
   trade when accepted, logs the decline otherwise, then clears the flag. */
export function resolveOffer(payload: ResolveOfferPayload): void {
  return chain(cloneDeep(getGameState()))
    .thru((state) => ({ state, offer: state.pendingOffer }))
    .thru(({ state, offer }) =>
      match(offer)
        .with(nullish, noop)
        .when((o) => o.toId !== payload.playerId, noop)
        .otherwise(
          (o) =>
            void chain(Object.assign(state, { pendingOffer: null }))
              .thru((s) => applyDecision(s, o, payload.accept))
              .tap((s) => setGameState(s))
              .value(),
        ),
    )
    .value();
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
      Object.assign(
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
  return chain(Object.assign(state, spendActionCard(state, aId, 'TRADE')))
    .tap((s) =>
      Object.entries(aGives).forEach(([t, amount]) =>
        transferCards(s, aId, bId, t, amount),
      ),
    )
    .tap((s) =>
      Object.entries(bGives).forEach(([t, amount]) =>
        transferCards(s, bId, aId, t, amount),
      ),
    )
    .tap((s) =>
      Object.assign(s.players[aId], {
        influence: s.players[aId].influence + 1,
      }),
    )
    .thru((s) =>
      Object.assign(
        s,
        log(
          s,
          `🔁 ${s.players[aId].name} trades ${fmtCards(aGives)} to ${s.players[bId].name} for ${fmtCards(bGives)}  [+1⭐ influence]`,
          'trade',
        ),
      ),
    )
    .value();
}

function transferCards(
  s: GameState,
  fromId: number,
  toId: number,
  t: string,
  amount: number,
): void {
  return void chain(s)
    .tap((st) =>
      Object.assign(st.players[fromId].hand, {
        [t]: st.players[fromId].hand[t] - amount,
      }),
    )
    .tap((st) =>
      Object.assign(st.players[toId].hand, {
        [t]: st.players[toId].hand[t] + amount,
      }),
    )
    .value();
}
