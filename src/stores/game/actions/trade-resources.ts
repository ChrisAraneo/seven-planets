import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';
import type { MakeOfferPayload } from '@/stores/game/mutations/make-offer/make-offer';

export function tradeResources(
  context: ActionContext<GameModuleState, RootState>,
  payload: MakeOfferPayload,
) {
  return context.commit('tradeResources', payload);
}
