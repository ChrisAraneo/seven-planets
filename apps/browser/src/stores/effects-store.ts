import type { Anim } from '@seven-planets/effects';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEffectsStore = defineStore('effects', () => {
  const anims = ref<Anim[]>([]);
  const fastMode = ref(false);
  return { anims, fastMode };
});
