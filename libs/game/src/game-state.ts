import type { Store } from 'vuex';

import type { GameState } from './interfaces/game-state';

/* =====================================================================
   Access to the live Vuex store for code running outside components
   (engine rules, shared actions, the AI agent). The app installs the
   store here on creation; this module has no runtime import of the store,
   so engine/AI code can depend on it without creating an import cycle.

   The game lib only needs the store to expose a `game` module holding the
   GameState — it stays deliberately unaware of the app's other modules
   (ui, effects, ai, …), so it never depends on the app's RootState.

   Engine/AI hot loops resolve the state millions of times per simulated
   game, so this is a direct property read — no lookups, no injection.
   ===================================================================== */

/** The minimal root shape the game lib requires of whatever store the app
    installs: a `game` module whose `state` is the GameState. */
export type GameStore = Store<{ game: { state: GameState } }>;

let store: GameStore | null = null;

/** Called once by the app when the store is created. The app passes its own
    full `Store<RootState>`; we only rely on the `game` slice (Vuex `Store` is
    invariant in its state type, so the param is widened to accept it). */
export function installStore(s: Store<unknown>): void {
  store = s as GameStore;
}

/** The live Vuex store (for dispatching actions outside components). */
export function getStore(): GameStore {
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
