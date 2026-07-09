import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';
import type { RecruitTroopsPayload } from '@/stores/game/mutations/recruit-troops/recruit-troops';

export function recruitTroops(
  context: ActionContext<GameModuleState, RootState>,
  payload: RecruitTroopsPayload,
) {
  return context.commit('recruitTroops', payload);
}
