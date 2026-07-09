import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';

export function pickCard(
  context: ActionContext<GameModuleState, RootState>,
  payload,
) {
  return context.commit('pickCard', payload);
}
