import { defineStore } from 'pinia';
import { useObservable } from '@vueuse/rxjs';

import { getGameState, type GameState } from '@seven-planets/game';

/* The live GameState, bridged from the game lib's RxJS getGameState() into a Vue
   ref (vue-rx style, via @vueuse/rxjs). Every emitted snapshot has a
   fresh top-level identity, so templates and computeds reading through
   `state` re-evaluate per emission. Components act by calling the game
   lib's action functions directly (attackPlanet, pickCard, endTurn, …) —
   never by writing to this ref. */
export const useGameStore = defineStore('game', () => {
  return { state: useObservable<GameState, GameState>(getGameState()) };
});
