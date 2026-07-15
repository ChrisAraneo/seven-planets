import { assign, cloneDeep } from 'lodash-es';
import { chain } from '../../utils/chain';
import { match } from 'ts-pattern';
import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';
import type { MakeOfferPayload } from '../../actions/make-offer/make-offer';

import { RESOURCE_TYPES, CARDS } from '../../config/constants';
import { setStatus } from '../../functions/set-status';
import { AUTO_HUMAN } from '../../functions/auto-human';
import { hasActionCard } from '../../functions/has-action-card';
import { log } from '../../functions/log';

/* Reducer branch. Sets pendingOffer on a private clone — the emission that
   carries it is the whole notification. The partner seat (human via
   TradeOfferModal, or the AI watcher) must answer by dispatching
   resolveOffer, which executes or declines the trade. */
export function applyMakeOffer(
  state: GameState,
  payload: MakeOfferPayload,
): GameState {
  return match(state)
    .when(
      (state) => payload.playerId !== state.activeId || Boolean(state.over),
      (state) => state,
    )
    .when(
      (state) =>
        !state.players[payload.partnerId] ||
        payload.partnerId === payload.playerId ||
        !state.players[payload.partnerId].isAlive,
      (state) => state,
    )
    .when(
      (state) => !hasActionCard(state.players[payload.playerId], 'TRADE'),
      (state) => state,
    )
    .otherwise((state) =>
      chain(cloneDeep(state))
        .tap((clone) =>
          sendOffer(
            clone,
            clone.players[payload.playerId],
            clone.players[payload.partnerId],
            payload,
          ),
        )
        .value(),
    );
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
    .thru((state) => getStatusIfHuman(state, player, partner))
    // The emitted snapshot IS the notification: the partner seat reacts to
    // pendingOffer appearing on it (TradeOfferModal for the human, the AI's
    // watcher for AI seats) and answers by dispatching resolveOffer.
    .thru((state) =>
      assign(state, {
        pendingOffer: { fromId: playerId, toId: partnerId, gives, gets },
      }),
    )
    .value();
}

function logSeeking(
  state: GameState,
  player: Player,
  gets: MakeOfferPayload['gets'],
): GameState {
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

function getStatusIfHuman(
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
