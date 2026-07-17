import type { Anim } from '@seven-planets/effects';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/* Presentation-effects state. The effects layer enqueues canvas animations
   here (via the sink main.ts injects); the GameBoard component drains the
   queue in its render loop (the array reference is stable — never reassign
   it). Pure presentation — the game core never touches it. */
export const useEffectsStore = defineStore('effects', () => {
  /** Live animation queue, drained by the GameBoard render loop. */
  const anims = ref<Anim[]>([]);
  const fastMode = ref(false);
  return { anims, fastMode };
});
