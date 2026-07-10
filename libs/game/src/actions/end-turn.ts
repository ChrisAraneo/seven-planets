import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { EndTurnPayload } from '../mutations/end-turn/end-turn';

export function endTurn(
  context: ActionContext<GameModuleState, unknown>,
  payload: EndTurnPayload,
) {
  return context.commit('endTurn', payload);
}
