/* Pending trade-offer callback: the AI registers this so it can respond to
   an offer directed at it synchronously (makeOffer calls it right after
   writing pendingOffer to state), without relying on async watchers. This
   is plain control-flow plumbing — not observable game state — so it lives
   here as module state rather than in the store. The per-turn engine input
   (pool picks, action turns) is driven by the flags on GameState and the
   coroutine in engine-driver.ts, not by a callback. */

/** Called synchronously by makeOffer after pendingOffer is written to state. */
let pendingOfferCallback: ((toId: number) => void) | null = null;

export function getPendingOfferCallback(): ((toId: number) => void) | null {
  return pendingOfferCallback;
}
export function setPendingOfferCallback(
  value: ((toId: number) => void) | null,
): void {
  pendingOfferCallback = value;
}
