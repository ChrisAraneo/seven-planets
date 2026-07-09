import type { Module } from 'vuex';
import type { GameState } from '@/game/types';
import type { RootState } from '../index';
import { ACTIONS } from './actions/actions';
import { GETTERS } from './getters/getters';
import { MUTATIONS } from './mutations/mutations';
import { initializeState } from './functions/initialize-state';

export interface GameModuleState {
  state: GameState;
}

export const game: Module<GameModuleState, RootState> = {
  namespaced: true,
  state: () => ({ state: initializeState() }),
  actions: ACTIONS,
  getters: GETTERS,
  mutations: MUTATIONS,
};
