import type { Cost, Hand } from '@seven-planets/game';

export function handAfterCost(hand: Hand, cost: Cost): Hand {
  const after: Hand = { ...hand };
  let relics = 0;
  for (const type in cost) {
    const use = Math.min(after[type] || 0, cost[type]);
    after[type] = (after[type] || 0) - use;
    relics += cost[type] - use;
  }
  after.RELIC = (after.RELIC || 0) - relics;
  return after;
}
