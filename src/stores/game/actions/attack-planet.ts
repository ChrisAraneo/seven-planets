import type { ActionContext } from 'vuex';
import type { GameModuleState } from '../game';
import type { RootState } from '@/stores';
import type { AttackPlanetPayload } from '@/game/engine/attack-planet/attack-planet';

export function attackPlanet(
  context: ActionContext<GameModuleState, RootState>,
  payload: AttackPlanetPayload,
) {
  return context.commit('attackPlanet', payload);
}
