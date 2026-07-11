import { createPinia, setActivePinia } from 'pinia';
import { watch } from 'vue';

import { installAi } from '@seven-planets/ai';
import { installGameState } from '@seven-planets/game';

import { useEffectsStore } from './effects-store';
import { useGameStore } from './game-store';
import { useUiStore } from './ui-store';
import { useUnlocksStore } from './unlocks-store';

/* =====================================================================
   The composition root. One Pinia, four stores:

     game    — the live game state (the game lib's action functions are
               the only ways to act — human UI and AI both call them)
     ui      — modals / difficulty / lifecycle (presentation-side)
     effects — animation queue + pacing flags (presentation-side)
     unlocks — earned difficulty levels (persisted)

   The game lib owns no store: importing this module activates Pinia
   (usable outside components and in headless scripts/tests, where no
   Vue app exists), wires the lib's state accessor to the game store,
   and seats the AI's watchers. The engine's rules mutate the game
   state object directly through that accessor; Pinia's reactivity is
   what lets the UI and the AI observe it.
   ===================================================================== */

export const pinia = createPinia();
setActivePinia(pinia);

export { useEffectsStore } from './effects-store';
export { useGameStore } from './game-store';
export { useUiStore, type ModalName } from './ui-store';
export { useUnlocksStore } from './unlocks-store';

// Wire the game lib's state accessor to the game store — engine/AI code
// reads and replaces the live state through this, with no store import.
const gameStore = useGameStore();
installGameState({
  get: () => gameStore.state,
  set: (state) => {
    gameStore.state = state;
  },
});

// Seat the AI: watchers on the live state drive every non-human seat.
installAi();

// When the human wins, unlock the next difficulty rung and persist it.
// Fires once per game (state.over is set exactly once; raw headless states
// are not reactive, so the watcher stays silent there).
watch(
  () => gameStore.state.over,
  (over) => {
    const level = useUiStore().difficulty;
    if (over?.winner?.isHuman && level) {
      useUnlocksStore().recordWin(level);
    }
  },
);
