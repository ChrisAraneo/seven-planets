import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { MoveTroopsPayload } from '../mutations/move-troops/move-troops';

export function moveTroops(
  context: ActionContext<GameModuleState, unknown>,
  payload: MoveTroopsPayload,
) {
  return context.commit('moveTroops', payload);
}
