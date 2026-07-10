import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RecruitTroopsPayload } from '../mutations/recruit-troops/recruit-troops';

export function recruitTroops(
  context: ActionContext<GameModuleState, unknown>,
  payload: RecruitTroopsPayload,
) {
  return context.commit('recruitTroops', payload);
}
