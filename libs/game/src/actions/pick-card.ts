import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { PickCardPayload } from '../mutations/pick-card/pick-card';

export function pickCard(
  context: ActionContext<GameModuleState, unknown>,
  payload: PickCardPayload,
) {
  return context.commit('pickCard', payload);
}
