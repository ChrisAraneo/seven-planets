import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { ResolveOfferPayload } from '../mutations/resolve-offer/resolve-offer';

export function resolveOffer(
  context: ActionContext<GameModuleState, unknown>,
  payload: ResolveOfferPayload,
) {
  return context.commit('resolveOffer', payload);
}
