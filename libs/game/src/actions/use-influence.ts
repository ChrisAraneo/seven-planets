import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { UseInfluencePayload } from '../mutations/use-influence/use-influence';

export function useInfluence(
  context: ActionContext<GameModuleState, unknown>,
  payload: UseInfluencePayload,
) {
  return context.commit('useInfluence', payload);
}
