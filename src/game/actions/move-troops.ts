import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';
import type { MoveTroopsPayload } from '@/game/mutations/move-troops/move-troops';

export function moveTroops(
  context: ActionContext<GameModuleState, RootState>,
  payload: MoveTroopsPayload,
) {
  return context.commit('moveTroops', payload);
}
