/* Pending input resolvers: the engine's async loop parks on these until
   the seat in play answers by dispatching a store action (pool pick,
   end of the human's action turn, trade-offer response). They are plain
   control-flow plumbing — not observable game state — so they live here
   as module state rather than in the store. */

let poolResolve: ((idx: number) => void) | null = null;
let humanResolve: (() => void) | null = null;
let offerResolve: ((accept: boolean) => void) | null = null;

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

export function getOfferResolve(): ((accept: boolean) => void) | null {
  return offerResolve;
}
export function setOfferResolve(v: ((accept: boolean) => void) | null): void {
  offerResolve = v;
}

/** Drop any parked resolvers (used when a fresh game state is installed). */
export function resetResolvers(): void {
  poolResolve = null;
  humanResolve = null;
  offerResolve = null;
}
