import { createStore, type Module } from 'vuex';
import type { GameState } from './interfaces/game-state';
import { ACTIONS } from './actions/actions';
import { GETTERS } from './getters/getters';
import { MUTATIONS } from './mutations/mutations';
import { initializeState } from './functions/initialize-state';

export interface GameModuleState {
  state: GameState;
}

export const game: Module<GameModuleState, unknown> = {
  namespaced: true,
  state: () => ({ state: initializeState() }),
  actions: ACTIONS,
  getters: GETTERS,
  mutations: MUTATIONS,
};
