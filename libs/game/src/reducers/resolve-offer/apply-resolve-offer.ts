import { assign, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { ResolveOfferPayload } from '../../actions/resolve-offer/resolve-offer';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { nullish } from '../../utils/p';
import { applyDecision } from './apply-decision';

export const applyResolveOffer = (
  state: GameState,
  payload: ResolveOfferPayload,
): GameState =>
  match(state.pendingOffer)
    .with(nullish, () => state)
    .when(
      (offer) => offer.toId !== payload.playerId,
      () => state,
    )
    .otherwise((offer) =>
      chain(cloneDeep(state))
        .thru((cl1) => assign(cl1, { pendingOffer: null }))
        .thru((cl1) => applyDecision(cl1, offer, payload.isAccepted))
        .value(),
    );
