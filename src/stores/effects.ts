import { defineStore } from 'pinia';
import { ref, shallowReactive } from 'vue';

import type { Anim } from '@/game/effects';

/* =====================================================================
   Presentation-effects state (formerly module-level in game/effects.ts).
   The engine enqueues canvas animations into `anims`; the GameBoard
   component drains the queue in its render loop.
   ===================================================================== */

export const useEffectsStore = defineStore('effects', () => {
  /** Live animation queue, drained by the GameBoard render loop. */
  const anims = shallowReactive<Anim[]>([]);
  const fastMode = ref(false);
  // Headless simulations skip all delays and animations
  const simMode = ref(false);

  return { anims, fastMode, simMode };
});

type EffectsStore = ReturnType<typeof useEffectsStore>;

// Cached accessor — the engine consults pacing (sleep/speedMult) constantly;
// Resolving the store through pinia's useStore() every time is too slow.
// Assumes one Pinia per process / test module (see stores/game-state.ts).
let cachedStore: EffectsStore | undefined;

export function getEffectsStore(): EffectsStore {
  return (cachedStore ??= useEffectsStore());
}
