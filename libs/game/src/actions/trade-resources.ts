import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { MakeOfferPayload } from '../mutations/make-offer/make-offer';

export function tradeResources(
  context: ActionContext<GameModuleState, unknown>,
  payload: MakeOfferPayload,
) {
  return context.commit('tradeResources', payload);
}
