import { getGameStateStore } from '@/stores/game-state';

/* Accessors for the pending human-input resolvers, which live in the
   game-state Pinia store. The engine's async loop parks on these until
   the UI answers (draft pick / action turn / trade offer). */

export function getPoolResolve(): ((idx: number) => void) | null {
  return getGameStateStore().poolResolve;
}
export function setPoolResolve(v: ((idx: number) => void) | null): void {
  getGameStateStore().poolResolve = v;
}

export function getHumanResolve(): (() => void) | null {
  return getGameStateStore().humanResolve;
}
export function setHumanResolve(v: (() => void) | null): void {
  getGameStateStore().humanResolve = v;
}

export function getOfferResolve(): ((accept: boolean) => void) | null {
  return getGameStateStore().offerResolve;
}
export function setOfferResolve(v: ((accept: boolean) => void) | null): void {
  getGameStateStore().offerResolve = v;
}
