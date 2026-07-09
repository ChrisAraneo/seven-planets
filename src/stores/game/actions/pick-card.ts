import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';
import type { PickCardPayload } from '@/game/engine/pick-card/pick-card';

export function pickCard(
  context: ActionContext<GameModuleState, RootState>,
  payload: PickCardPayload,
) {
  return context.commit('pickCard', payload);
}
