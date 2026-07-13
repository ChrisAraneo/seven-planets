import { defineStore } from 'pinia';
import { useObservable } from '@vueuse/rxjs';

import {
  getGameStateLastValue,
  getGameState,
  type GameState,
} from '@seven-planets/game';

/* The live GameState, bridged from the game lib's RxJS getGameState() into a Vue
   ref (vue-rx style, via @vueuse/rxjs). Every emitted snapshot has a
   fresh top-level identity, so templates and computeds reading through
   `state` re-evaluate per emission. Components act by calling the game
   lib's action functions directly (attackPlanet, pickCard, endTurn, …) —
   never by writing to this ref. */
export const useGameStore = defineStore('game', () => {
  // Both type parameters: the second is the initial-value type — leaving it
  // to default (undefined) would type `state` as GameState | undefined.
  const state = useObservable<GameState, GameState>(getGameState(), {
    initialValue: getGameStateLastValue(),
  });
  return { state };
});
