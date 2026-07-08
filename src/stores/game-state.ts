import { defineStore } from 'pinia';
import { markRaw, ref, shallowRef } from 'vue';

import { buildState } from '@/game/engine/state';
import type { GameState } from '@/game/types';

/* =====================================================================
   The single source of truth for the live game state. Engine and AI
   functions read it via getGameState() instead of receiving the state
   as an argument, so every mutation flows through Pinia.

   The UI-facing orchestration store (./game.ts) composes this store;
   keeping the raw state here (with no engine imports beyond the state
   factory) breaks the import cycle stores → engine → stores.
   ===================================================================== */

export const useGameStateStore = defineStore('game-state', () => {
  // The live game state. reset() swaps in a fresh one — headless simulation
  // Runs many games back to back; the app reloads the page for a new game.
  const state = ref<GameState>(buildState());

  // Pending human-input resolvers: the engine's async loop parks on these
  // Promises until the UI answers (draft pick / action turn / trade offer).
  const poolResolve = shallowRef<((idx: number) => void) | null>(null);
  const humanResolve = shallowRef<(() => void) | null>(null);
  const offerResolve = shallowRef<((accept: boolean) => void) | null>(null);

  function reset(opts: { raw?: boolean } = {}): void {
    // Headless simulations run thousands of games and never render, so they
    // Opt out of Vue's deep reactive proxying of the state (markRaw) — the
    // Proxy traps would dominate the engine's hot loops otherwise.
    state.value = opts.raw ? markRaw(buildState()) : buildState();
    poolResolve.value = null;
    humanResolve.value = null;
    offerResolve.value = null;
  }

  return { state, poolResolve, humanResolve, offerResolve, reset };
});

type GameStateStore = ReturnType<typeof useGameStateStore>;

// Engine/AI hot loops resolve the store millions of times per simulated game;
// Pinia's useStore() (and even getActivePinia()) is far too slow for that, so
// Cache the instance once. This assumes one Pinia per process / test module —
// True for the app, the headless scripts, and vitest's per-file module graphs.
let cachedStore: GameStateStore | undefined;

export function getGameStateStore(): GameStateStore {
  return (cachedStore ??= useGameStateStore());
}

/** The current game state, for engine/AI functions running outside components. */
export function getGameState(): GameState {
  return getGameStateStore().state;
}
