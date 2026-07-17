import { installAi } from '@seven-planets/ai';
import { getGameState } from '@seven-planets/game';
import { createPinia, setActivePinia } from 'pinia';
import { distinctUntilChanged, map } from 'rxjs';

import { useUiStore } from './ui-store';
import { useUnlocksStore } from './unlocks-store';

/* =====================================================================
   The composition root. One Pinia, four stores:

     game    — a Vue ref over the game lib's getGameState() observable (the
               game lib's action functions are the only ways to act —
               human UI and AI both call them)
     ui      — modals / difficulty / lifecycle (presentation-side)
     effects — animation queue + pacing flags (presentation-side)
     unlocks — earned difficulty levels (persisted)

   The game lib OWNS the live state as an RxJS BehaviorSubject and emits
   snapshots on getGameState(); the game store merely subscribes (via
   @vueuse/rxjs) so templates react. Importing this module activates
   Pinia (usable outside components and in headless scripts/tests) and
   seats the AI's subscriptions.
   ===================================================================== */

export const pinia = createPinia();
setActivePinia(pinia);

export { useEffectsStore } from './effects-store';
export { useGameStore } from './game-store';
export { type ModalName, useUiStore } from './ui-store';
export { useUnlocksStore } from './unlocks-store';

// Seat the AI: subscriptions on getGameState() drive every non-human seat.
installAi();

// When the human wins, unlock the next difficulty rung and persist it.
// Fires once per game (state.over is set exactly once).
getGameState()
  .pipe(
    map((snapshot) => snapshot.over),
    distinctUntilChanged(),
  )
  .subscribe((over) => {
    const level = useUiStore().difficulty;
    if (over?.winner?.isHuman && level) {
      useUnlocksStore().recordWin(level);
    }
  });
