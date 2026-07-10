import type { Cost, Hand } from '@seven-planets/game';

export function handAfterCost(hand: Hand, cost: Cost): Hand {
  const after: Hand = { ...hand };
  let relics = 0;
  for (const t in cost) {
    const use = Math.min(after[t] || 0, cost[t]);
    after[t] = (after[t] || 0) - use;
    relics += cost[t] - use;
  }
  after.RELIC = (after.RELIC || 0) - relics;
  return after;
}
