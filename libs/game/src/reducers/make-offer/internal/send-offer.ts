import { assign, chain } from 'lodash-es';

import type { MakeOfferPayload } from '../../../actions/make-offer/make-offer';
import type { GameState } from '../../../interfaces/game-state';
import type { Player } from '../../../interfaces/player';
import { getStatusIfHuman } from './get-status-if-human';
import { logSeeking } from './log-seeking';

export const sendOffer = (
  state: GameState,
  player: Player,
  partner: Player,
  { playerId, partnerId, gives, gets }: MakeOfferPayload,
): void =>
  void chain(state)
    .tap(() => assign(player, { hasTradedCurrentTurn: true }))
    .thru(() => logSeeking(state, player, gets))
    .thru(() => getStatusIfHuman(state, player, partner))
    .thru(() =>
      assign(state, {
        pendingOffer: { fromId: playerId, toId: partnerId, gives, gets },
      }),
    )
    .value();
