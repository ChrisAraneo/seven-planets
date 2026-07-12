import { match, P } from 'ts-pattern';
import type { GameState } from './interfaces/game-state';
import { initializeState } from './functions/initialize-state';
import { markRaw } from 'vue';

import { resetEngine } from './functions/engine-driver';

const { nonNullable } = P;

/* =====================================================================
   The game lib owns NO store. It only needs somewhere to read the live
   GameState from and write the next GameState to — the app installs an
   accessor pair backed by whatever holds the state (the browser wires a
   Pinia store so the UI reacts; headless runs wire a plain holder).

   Engine/AI hot loops resolve the state millions of times per simulated
   game, so the accessors are direct function calls — no lookups, no
   injection framework.
   ===================================================================== */

export interface GameStateAccess {
  /** The live game state (the same object the engine mutates in place). */
  get(): GameState;
  /** Install a freshly-produced state as the live one. */
  set(state: GameState): void;
}

let access: GameStateAccess | null = null;

/** True in headless runs: states are installed markRaw'd to keep Vue's
    reactive proxies out of the engine hot loop. Set via resetGameState. */
let raw = false;

/** Called once by the composition root (browser app or headless script)
    before any engine/AI call. */
export function installGameState(gameStateAccess: GameStateAccess): void {
  access = gameStateAccess;
}

/** The current game state, for engine/AI functions running outside components. */
export function getGameState(): GameState {
  return requireAccess(access).get();
}

/** Install a freshly-produced (immutable) GameState as the live state.
    A spread-produced state is plain, so raw mode re-applies markRaw. */
export function setGameState(state: GameState): void {
  return requireAccess(access).set(
    match(raw)
      .with(true, () => markRaw(state))
      .otherwise(() => state),
  );
}

/** Swap in a fresh game state (headless simulations run many games back to
    back; the app reloads the page for a new game). `raw` skips Vue's deep
    reactive proxying — nothing renders in headless runs and the proxy traps
    would dominate the engine's hot loops. */
export function resetGameState(opts: { raw?: boolean } = {}): void {
  raw = Boolean(opts.raw);
  setGameState(initializeState());
  resetEngine();
}

// The one place the lib fails fast: engine/AI calls are meaningless without an
// installed accessor, so absence must escalate rather than fall back.
function requireAccess(
  gameStateAccess: GameStateAccess | null,
): GameStateAccess {
  return match(gameStateAccess)
    .with(nonNullable, (installed) => installed)
    .otherwise(() => {
      throw new Error(
        'Game state access not installed — import "@/stores" before any engine/AI call.',
      );
    });
}
