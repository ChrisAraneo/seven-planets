import { defineStore } from 'pinia';
import { ref } from 'vue';

import { initializeState, type GameState } from '@seven-planets/game';

/* The live GameState. The game lib never sees this store — the composition
   root (stores/index.ts) wires the lib's state accessor to it, so engine/AI
   code reads and replaces the state through plain functions while the UI
   reacts to it through Pinia. Components act by calling the game lib's
   action functions directly (attackPlanet, pickCard, endTurn, …). */
export const useGameStore = defineStore('game', () => {
  const state = ref<GameState>(initializeState());
  return { state };
});
