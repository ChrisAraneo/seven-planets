import { type GameState, getGameState } from '@seven-planets/game';
import { useObservable } from '@vueuse/rxjs';
import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', () => ({
  state: useObservable<GameState, GameState>(getGameState()),
}));
