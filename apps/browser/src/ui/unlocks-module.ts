import type { Module } from 'vuex';

import { DIFFICULTIES, type Difficulty } from '@seven-planets/game';

import type { RootState } from '@/stores';

/* =====================================================================
   SEVEN PLANETS — difficulty unlocks.

   The three hardest levels are earned, not given: winning a game at one
   difficulty unlocks the next rung up. Progress is persisted to
   localStorage so it survives reloads (New Game reloads the page).

   Casual / Easy / Normal are always available (they never appear as an
   unlock TARGET below, so ALWAYS_UNLOCKED derives them automatically).
   ===================================================================== */

const STORAGE_KEY = 'seven-planets:unlocked-difficulties';

/** Winning at the KEY difficulty unlocks the VALUE difficulty. */
const UNLOCKED_BY_WIN: Partial<Record<Difficulty, Difficulty>> = {
  normal: 'hard',
  hard: 'impossible',
};

// Every level that is not the reward of some other win is free from the start.
const rewarded = new Set<Difficulty>(Object.values(UNLOCKED_BY_WIN));
const ALWAYS_UNLOCKED: Difficulty[] = DIFFICULTIES.map((d) => d.id).filter(
  (id) => !rewarded.has(id),
);

/** Read the unlocked set (always-unlocked ∪ persisted earned levels). Tolerant
    of missing/corrupt storage and environments without localStorage. */
function read(): Set<Difficulty> {
  const unlocked = new Set<Difficulty>(ALWAYS_UNLOCKED);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      for (const id of JSON.parse(raw) as Difficulty[]) {
        unlocked.add(id);
      }
    }
  } catch {
    /* No storage, or corrupt JSON — fall back to the always-unlocked set */
  }
  return unlocked;
}

/** Persist the earned levels (best-effort; private mode may reject writes). */
function write(unlocked: Set<Difficulty>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
  } catch {
    /* Storage unavailable — unlocks simply won't persist this session */
  }
}

export interface UnlocksModuleState {
  unlocked: Set<Difficulty>;
}

export const unlocks: Module<UnlocksModuleState, RootState> = {
  namespaced: true,

  state: () => ({ unlocked: read() }),

  getters: {
    isUnlocked: (state) => (id: Difficulty) => state.unlocked.has(id),
  },

  mutations: {
    unlock(state, id: Difficulty) {
      state.unlocked.add(id);
      write(state.unlocked);
    },
  },

  actions: {
    /** Record a human victory at `level`. If it unlocks a new difficulty,
        persist it and return the newly unlocked id; otherwise return null. */
    recordWin({ commit, state }, level: Difficulty): Difficulty | null {
      const next = UNLOCKED_BY_WIN[level];
      if (!next) {
        return null;
      }
      if (state.unlocked.has(next)) {
        return null; // Already earned in a previous game
      }
      commit('unlock', next);
      return next;
    },
  },
};
