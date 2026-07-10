import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';
import type { ResolveOfferPayload } from '@/game/mutations/resolve-offer/resolve-offer';

export function resolveOffer(
  context: ActionContext<GameModuleState, RootState>,
  payload: ResolveOfferPayload,
) {
  return context.commit('resolveOffer', payload);
}
