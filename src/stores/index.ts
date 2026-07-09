import { createStore } from 'vuex';

// Imported via the same "@" specifier the engine/AI files use, so module
// Resolution yields ONE game-state instance under every runner (the jiti
// Scripts would otherwise instantiate './game-state' separately from
// '@/stores/game-state' and the installed store would not be seen).
import { installStore } from '@/stores/game-state';

import { effects, type EffectsModuleState } from './modules/effects';
import { game, type GameModuleState } from './modules/game';
import { ui, type UiModuleState } from './modules/ui';
import { unlocks, type UnlocksModuleState } from './modules/unlocks';

/* =====================================================================
   The Vuex store. One store, four modules:

     game    — the live game state + the player actions shared by the
               human UI and the AI agent (the only ways to act)
     ui      — modals / difficulty / lifecycle (presentation-side)
     effects — animation queue + pacing flags (presentation-side)
     unlocks — earned difficulty levels (persisted)

   Strict mode stays OFF by design: the engine's rules mutate the game
   state object directly (via getGameState()), and wrapping every deep
   mutation of the port's hot loops in commits would cripple headless
   simulations. The store actions in modules/game.ts are the shared
   entry points through which every player — human or AI — acts.
   ===================================================================== */

export interface RootState {
  game: GameModuleState;
  ui: UiModuleState;
  effects: EffectsModuleState;
  unlocks: UnlocksModuleState;
}

export const store = createStore<RootState>({
  modules: { game, ui, effects, unlocks },
});

// Engine/AI/effects code accesses the store through @/stores/game-state
// (a plain module slot) instead of importing this file, avoiding cycles.
installStore(store);

// When the human wins, unlock the next difficulty rung and persist it.
// Fires once per game (state.over is set exactly once; headless runs use
// A non-reactive state, so the watcher stays silent there).
store.watch(
  (s) => s.game.state.over,
  (over) => {
    const level = store.state.ui.difficulty;
    if (over?.winner?.isHuman && level) {
      void store.dispatch('unlocks/recordWin', level);
    }
  },
);
