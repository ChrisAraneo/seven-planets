import type { Module } from 'vuex';

import { setAiDifficulty } from '@seven-planets/ai';
import {
  DEFAULT_DIFFICULTY,
  type Difficulty,
  getDifficulty,
} from '@seven-planets/game';
import { assignKamikazes } from '@seven-planets/game';
import { AUTO_HUMAN } from '@seven-planets/game';
import { runGame } from '@seven-planets/game';
import { getGameState } from '@seven-planets/game';

import type { RootState } from '@/stores';

/* =====================================================================
   UI orchestration state: which modal is open, the chosen difficulty
   and the game lifecycle (start / new game). Pure presentation-side
   state — the game core never reads it.
   ===================================================================== */

export type ModalName =
  | 'help'
  | 'attack'
  | 'recruit'
  | 'move'
  | 'trade'
  | 'influence'
  | null;

export interface UiModuleState {
  modal: ModalName;
  started: boolean;
  /** The human's chosen difficulty. Null until picked — the game loop waits
      for the choice (see start / chooseDifficulty). */
  difficulty: Difficulty | null;
}

export const ui: Module<UiModuleState, RootState> = {
  namespaced: true,

  state: () => ({ modal: null, started: false, difficulty: null }),

  mutations: {
    openModal(state, name: ModalName) {
      state.modal = name;
    },
    closeModal(state) {
      state.modal = null;
    },
    setDifficulty(state, level: Difficulty) {
      state.difficulty = level;
    },
    setStarted(state) {
      state.started = true;
    },
  },

  actions: {
    /** Called from the root component on mount. In demo mode ("?auto"/headless)
        the game starts immediately; otherwise it waits for the human to pick a
        difficulty via the opening DifficultyModal (see chooseDifficulty). */
    start({ commit, dispatch, state }) {
      if (state.started) {
        return;
      }
      // Demo mode ("?auto") runs at full tilt with no difficulty prompt.
      if (AUTO_HUMAN) {
        commit('effects/setFastMode', true, { root: true });
        void dispatch('chooseDifficulty', DEFAULT_DIFFICULTY);
      }
    },

    /** The human picked a difficulty on the opening screen — boot the game loop.
        (Every level is currently identical; the choice is stored for later use.) */
    chooseDifficulty({ commit, state }, level: Difficulty) {
      if (state.started) {
        return;
      }
      commit('setDifficulty', level);
      const def = getDifficulty(level);
      // Apply this level's handicap to every mastermind AI before the loop runs,
      // Then assign its kamikazes (Hard mode: 2 AI that hunt only the human).
      setAiDifficulty(def.ai);
      assignKamikazes(getGameState(), def.kamikazeCount);
      commit('setStarted');
      void runGame();
    },

    newGame() {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    },
  },
};
