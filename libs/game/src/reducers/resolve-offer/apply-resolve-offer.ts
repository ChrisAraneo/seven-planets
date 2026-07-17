import { assign, cloneDeep } from 'lodash-es';
import { match, P } from 'ts-pattern';

import type { ResolveOfferPayload } from '../../actions/resolve-offer/resolve-offer';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { applyDecision } from './apply-decision';

const { nullish } = P;
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
        .thru((clone) => assign(clone, { pendingOffer: null }))
        .thru((clone) => applyDecision(clone, offer, payload.isAccepted))
        .value(),
    );
