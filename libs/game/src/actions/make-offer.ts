import { chain, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { getGameState, setGameState } from '../game-state';

import { RESOURCE_TYPES, CARDS } from '../config/constants';
import { setStatus } from '../functions/set-status';
import { AUTO_HUMAN } from '../functions/auto-human';
import { hasActionCard } from '../functions/has-action-card';
import { log } from '../functions/log';
import { getPendingOfferCallback } from '../functions/resolver-state';

export interface MakeOfferPayload {
  playerId: number;
  partnerId: number;
  gives: Cost;
  gets: Cost;
}

/* Sets pendingOffer on game state and returns immediately. The partner
   seat (human via TradeOfferModal, or the AI watcher) must answer by
   dispatching resolveOffer, which executes or declines the trade. */
export function makeOffer(payload: MakeOfferPayload): void {
  return chain(cloneDeep(getGameState()))
    .thru((state) => ({
      state,
      player: state.players[payload.playerId],
      partner: state.players[payload.partnerId] as Player | undefined,
    }))
    .thru(({ state, player, partner }) =>
      match({ state, player, partner })
        .when(
          ({ state: s }) => payload.playerId !== s.activeId || Boolean(s.over),
          noop,
        )
        .when(
          ({ player: pl, partner: pa }) =>
            !pa || pa.id === pl.id || !pa.isAlive,
          noop,
        )
        .when(({ player: pl }) => !hasActionCard(pl, 'TRADE'), noop)
        .otherwise(
          ({ state: s, player: pl, partner: pa }) =>
            void (pa && sendOffer(s, pl, pa, payload)),
        ),
    )
    .value();
}

function sendOffer(
  state: GameState,
  player: Player,
  partner: Player,
  { playerId, partnerId, gives, gets }: MakeOfferPayload,
): void {
  return void chain(state)
    // Note the attempt; the AI plans at most one trade per turn off this flag
    // (nothing restricts the human's seat, matching the original behavior).
    .tap(() => Object.assign(player, { hasTradedCurrentTurn: true }))
    .thru((s) => logSeeking(s, player, gets))
    .thru((s) => statusIfHuman(s, player, partner))
    .thru((s) =>
      Object.assign(s, {
        pendingOffer: { fromId: playerId, toId: partnerId, gives, gets },
      }),
    )
    .tap((s) => setGameState(s))
    // Notify synchronously so AI seats can respond without relying on async
    // Vue watchers, which may not fire reliably across full state replacements.
    .tap(() => getPendingOfferCallback()?.(partnerId))
    .value();
}

function logSeeking(state: GameState, player: Player, gets: Cost): GameState {
  return match(Object.keys(gets)[0])
    .when(
      (wantKey) =>
        Boolean(wantKey && RESOURCE_TYPES.includes(wantKey as never)),
      (wantKey) =>
        Object.assign(
          state,
          log(
            state,
            `📡 ${player.name} opens a trade channel — seeking ${CARDS[wantKey].icon} ${CARDS[wantKey].name}`,
            'trade',
          ),
        ),
    )
    .otherwise(() => state);
}

function statusIfHuman(
  state: GameState,
  player: Player,
  partner: Player,
): GameState {
  return match(partner.isHuman && !AUTO_HUMAN)
    .with(true, () =>
      Object.assign(
        state,
        setStatus(state, `${player.name} is hailing you with a trade offer…`),
      ),
    )
    .otherwise(() => state);
}
