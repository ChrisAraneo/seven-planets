import type { Module } from 'vuex';

import type { Anim } from '@/effects/effects';

import type { RootState } from '@/stores';

/* =====================================================================
   Presentation-effects state. The effects layer (src/effects) enqueues
   canvas animations here; the GameBoard component drains the queue in
   its render loop. Pure presentation — the game core never touches it.
   ===================================================================== */

export interface EffectsModuleState {
  /** Live animation queue, drained by the GameBoard render loop. */
  anims: Anim[];
  fastMode: boolean;
}

export const effects: Module<EffectsModuleState, RootState> = {
  namespaced: true,

  state: () => ({ anims: [], fastMode: false }),

  mutations: {
    enqueue(state, anim: Anim) {
      state.anims.push(anim);
    },
    setFastMode(state, v: boolean) {
      state.fastMode = v;
    },
  },
};
