import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { AttackPlanetPayload } from '../mutations/attack-planet/attack-planet';

export function attackPlanet(
  context: ActionContext<GameModuleState, unknown>,
  payload: AttackPlanetPayload,
) {
  return context.commit('attackPlanet', payload);
}
