let poolResolve: ((idx: number) => void) | null = null;
export function getPoolResolve() {
  return poolResolve;
}
export function setPoolResolve(v: ((idx: number) => void) | null) {
  poolResolve = v;
}

let humanResolve: (() => void) | null = null;
export function getHumanResolve() {
  return humanResolve;
}
export function setHumanResolve(v: (() => void) | null) {
  humanResolve = v;
}

let offerResolve: ((accept: boolean) => void) | null = null;
export function getOfferResolve() {
  return offerResolve;
}
export function setOfferResolve(v: ((accept: boolean) => void) | null) {
  offerResolve = v;
}
