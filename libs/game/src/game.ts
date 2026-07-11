import { createStore, type Module } from 'vuex';
import type { GameState } from './interfaces/game-state';
import { ACTIONS } from './actions/actions';
import { GETTERS } from './getters/getters';
import { MUTATIONS } from './mutations/mutations';
import { initializeState } from './functions/initialize-state';

export interface GameModuleState {
  state: GameState;
  /** True in headless runs: the state was installed markRaw'd to keep Vue's
      reactive proxies out of the engine hot loop. `setState` preserves it. */
  raw: boolean;
}

export const game: Module<GameModuleState, unknown> = {
  namespaced: true,
  state: () => ({ state: initializeState(), raw: false }),
  actions: ACTIONS,
  getters: GETTERS,
  mutations: MUTATIONS,
};
