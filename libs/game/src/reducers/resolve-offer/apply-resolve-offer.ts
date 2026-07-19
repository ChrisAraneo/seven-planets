import { assign, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { ResolveOfferPayload } from '../../actions/resolve-offer';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { nullish } from '../../utils/p';
import { applyDecision } from './internal/apply-decision';

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
        .thru((clonedState) => assign(clonedState, { pendingOffer: null }))
        .thru((clonedState) =>
          applyDecision(clonedState, offer, payload.isAccepted),
        )
        .value(),
    );
