import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';

export function useInfluence(
  context: ActionContext<GameModuleState, RootState>,
  payload,
) {
  return context.commit('useInfluence', payload);
}
