import { cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { MakeOfferPayload } from '../../actions/make-offer/make-offer';
import { hasActionCard } from '../../functions/has-action-card';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { sendOffer } from './send-offer';

export const applyMakeOffer = (
  state: GameState,
  payload: MakeOfferPayload,
): GameState =>
  match(state)
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
