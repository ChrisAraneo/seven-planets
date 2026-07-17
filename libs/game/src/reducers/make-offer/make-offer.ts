import { assign, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { MakeOfferPayload } from '../../actions/make-offer/make-offer';
import { CARDS } from '../../config/constants';
import { IS_AUTO_HUMAN } from '../../functions/auto-human';
import { hasActionCard } from '../../functions/has-action-card';
import { isResourceType } from '../../functions/is-resource-type';
import { log } from '../../functions/log';
import { setStatus } from '../../functions/set-status';
import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';
import { chain } from '../../utils/chain';

export function applyMakeOffer(
  state: GameState,
  payload: MakeOfferPayload,
): GameState {
  return match(state)
    .when(
      () => payload.playerId !== state.activeId || Boolean(state.over),
      () => state,
    )
    .when(
      () =>
        !state.players[payload.partnerId] ||
        payload.partnerId === payload.playerId ||
        !state.players[payload.partnerId].isAlive,
      () => state,
    )
    .when(
      () => !hasActionCard(state.players[payload.playerId], 'TRADE'),
      () => state,
    )
    .otherwise(() =>
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
    .tap(() => assign(player, { hasTradedCurrentTurn: true }))
    .thru(() => logSeeking(state, player, gets))
    .thru(() => getStatusIfHuman(state, player, partner))
    .thru(() =>
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
      (wantKey) => isResourceType(wantKey),
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
  return match(partner.isHuman && !IS_AUTO_HUMAN)
    .with(true, () =>
      assign(
        state,
        setStatus(state, `${player.name} is hailing you with a trade offer…`),
      ),
    )
    .otherwise(() => state);
}
