import { assign, chain, cloneDeep, noop } from 'lodash-es';
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
          ({ state: eachState }) =>
            payload.playerId !== eachState.activeId || Boolean(eachState.over),
          noop,
        )
        .when(
          ({ player: eachPlayer, partner: innerPlayer }) =>
            !innerPlayer ||
            innerPlayer.id === eachPlayer.id ||
            !innerPlayer.isAlive,
          noop,
        )
        .when(
          ({ player: eachPlayer }) => !hasActionCard(eachPlayer, 'TRADE'),
          noop,
        )
        .otherwise(
          ({ state: eachState, player: eachPlayer, partner: innerPlayer }) =>
            void (
              innerPlayer &&
              sendOffer(eachState, eachPlayer, innerPlayer, payload)
            ),
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
    .tap(() => assign(player, { hasTradedCurrentTurn: true }))
    .thru((state) => logSeeking(state, player, gets))
    .thru((state) => statusIfHuman(state, player, partner))
    .thru((state) =>
      assign(state, {
        pendingOffer: { fromId: playerId, toId: partnerId, gives, gets },
      }),
    )
    // Installing the state IS the notification: the partner seat reacts to
    // pendingOffer appearing on it (TradeOfferModal for the human, the AI's
    // watcher for AI seats) and answers by dispatching resolveOffer.
    .tap((state) => setGameState(state))
    .value();
}

function logSeeking(state: GameState, player: Player, gets: Cost): GameState {
  return match(Object.keys(gets)[0])
    .when(
      (wantKey) =>
        Boolean(wantKey && RESOURCE_TYPES.includes(wantKey as never)),
      (wantKey) =>
        assign(
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
      assign(
        state,
        setStatus(state, `${player.name} is hailing you with a trade offer…`),
      ),
    )
    .otherwise(() => state);
}
