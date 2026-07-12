/* Pending input resolvers: the engine's async loop parks on these until
   the seat in play answers by dispatching a store action (pool pick,
   end of the human's action turn). They are plain control-flow plumbing
   — not observable game state — so they live here as module state rather
   than in the store. */

let poolResolve: ((index: number) => void) | null = null;
let humanResolve: (() => void) | null = null;
/** Called synchronously by makeOffer after pendingOffer is written to state.
    The AI registers this so it can respond without relying on async watchers. */
let pendingOfferCallback: ((toId: number) => void) | null = null;

export function getPoolResolve(): ((index: number) => void) | null {
  return poolResolve;
}
export function setPoolResolve(value: ((index: number) => void) | null): void {
  poolResolve = value;
}

export function getHumanResolve(): (() => void) | null {
  return humanResolve;
}
export function setHumanResolve(value: (() => void) | null): void {
  humanResolve = value;
}

export function getPendingOfferCallback(): ((toId: number) => void) | null {
  return pendingOfferCallback;
}
export function setPendingOfferCallback(
  value: ((toId: number) => void) | null,
): void {
  pendingOfferCallback = value;
}

/** Drop any parked resolvers (used when a fresh game state is installed). */
export function resetResolvers(): void {
  poolResolve = null;
  humanResolve = null;
}
