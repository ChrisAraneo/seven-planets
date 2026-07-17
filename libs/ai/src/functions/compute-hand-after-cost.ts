import type { Cost, Hand } from '@seven-planets/game';

export function computeHandAfterCost(hand: Hand, cost: Cost): Hand {
  const remaining: Hand = { ...hand };
  let relicsSpent = 0;
  for (const resourceType of Object.keys(cost)) {
    const paid = Math.min(remaining[resourceType] || 0, cost[resourceType]);
    remaining[resourceType] = (remaining[resourceType] || 0) - paid;
    relicsSpent += cost[resourceType] - paid;
  }
  remaining.RELIC = (remaining.RELIC || 0) - relicsSpent;
  return remaining;
}
