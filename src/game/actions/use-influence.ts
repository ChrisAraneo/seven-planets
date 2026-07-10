import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';
import type { UseInfluencePayload } from '@/game/mutations/use-influence/use-influence';

export function useInfluence(
  context: ActionContext<GameModuleState, RootState>,
  payload: UseInfluencePayload,
) {
  return context.commit('useInfluence', payload);
}
