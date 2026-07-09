import type { Store } from 'vuex';

import type { GameState } from '@/game/types';

import type { RootState } from './index';

/* =====================================================================
   Access to the live Vuex store for code running outside components
   (engine rules, shared actions, the AI agent). The store installs
   itself here on creation (see ./index.ts), so this module has no
   runtime import of the store — engine/AI files can depend on it
   without creating an import cycle.

   Engine/AI hot loops resolve the state millions of times per simulated
   game, so this is a direct property read — no lookups, no injection.
   ===================================================================== */

let store: Store<RootState> | null = null;

/** Called once by ./index.ts when the store is created. */
export function installStore(s: Store<RootState>): void {
  store = s;
}

/** The live Vuex store (for dispatching actions outside components). */
export function getStore(): Store<RootState> {
  if (!store) {
    throw new Error(
      'Vuex store not created yet — import "@/stores" before any engine/AI call.',
    );
  }
  return store;
}

/** The current game state, for engine/AI functions running outside components. */
export function getGameState(): GameState {
  return getStore().state.game.state;
}

/** Swap in a fresh game state (headless simulations run many games back to
    back; the app reloads the page for a new game). `raw` skips Vue's deep
    reactive proxying — nothing renders in headless runs and the proxy traps
    would dominate the engine's hot loops. */
export function resetGameState(opts: { raw?: boolean } = {}): void {
  getStore().commit('game/reset', opts);
}
