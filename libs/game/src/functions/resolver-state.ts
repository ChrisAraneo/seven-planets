/* Pending input resolvers: the engine's async loop parks on these until
   the seat in play answers by dispatching a store action (pool pick,
   end of the human's action turn). They are plain control-flow plumbing
   — not observable game state — so they live here as module state rather
   than in the store. */

let poolResolve: ((idx: number) => void) | null = null;
let humanResolve: (() => void) | null = null;
/** Called synchronously by makeOffer after pendingOffer is written to state.
    The AI registers this so it can respond without relying on async watchers. */
let pendingOfferCallback: ((toId: number) => void) | null = null;

export function getPoolResolve(): ((idx: number) => void) | null {
  return poolResolve;
}
export function setPoolResolve(v: ((idx: number) => void) | null): void {
  poolResolve = v;
}

export function getHumanResolve(): (() => void) | null {
  return humanResolve;
}
export function setHumanResolve(v: (() => void) | null): void {
  humanResolve = v;
}

export function getPendingOfferCallback(): ((toId: number) => void) | null {
  return pendingOfferCallback;
}
export function setPendingOfferCallback(
  v: ((toId: number) => void) | null,
): void {
  pendingOfferCallback = v;
}

/** Drop any parked resolvers (used when a fresh game state is installed). */
export function resetResolvers(): void {
  poolResolve = null;
  humanResolve = null;
}
