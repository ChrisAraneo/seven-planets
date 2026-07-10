import type { Cost, Player } from '@seven-planets/game';

import { incomePerTurn } from './income-per-turn';

export function affordEta(p: Player, cost: Cost): number {
  const inc = incomePerTurn(p);
  let wildcards = (p.hand.RELIC || 0) - (cost.RELIC || 0);
  let eta = 0;
  for (const t of Object.keys(cost)) {
    let short = cost[t] - (p.hand[t] || 0);
    if (short <= 0) {
      continue;
    }
    const useWild = Math.min(Math.max(0, wildcards), short);
    wildcards -= useWild;
    short -= useWild;
    if (short <= 0) {
      continue;
    }
    const flow = (inc[t] || 0) + 0.35;
    eta = Math.max(eta, short / flow);
  }
  return eta;
}
