import type { Module } from 'vuex';
import { buildState } from '@/game/engine/state';
import type { GameState } from '@/game/types';
import type { RootState } from '../index';
import { ACTIONS } from './actions/actions';
import { GETTERS } from './getters/getters';
import { MUTATIONS } from './mutations/mutations';

export interface GameModuleState {
  state: GameState;
}

export const game: Module<GameModuleState, RootState> = {
  namespaced: true,
  state: () => ({ state: buildState() }),
  actions: ACTIONS,
  getters: GETTERS,
  mutations: MUTATIONS,
};
