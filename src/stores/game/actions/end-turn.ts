import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';
import type { EndTurnPayload } from '@/game/engine/end-turn/end-turn';

export function endTurn(
  context: ActionContext<GameModuleState, RootState>,
  payload: EndTurnPayload,
) {
  return context.commit('endTurn', payload);
}
