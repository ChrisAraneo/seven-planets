import type { Cost, Hand } from '@seven-planets/game';

import { chain } from '../utils/chain';

export const computeHandAfterCost = (hand: Hand, cost: Cost): Hand =>
  chain(
    Object.keys(cost).reduce(
      (acc, resourceType) =>
        chain(Math.min(acc.remaining[resourceType] || 0, cost[resourceType]))
          .thru((paid) => ({
            remaining: {
              ...acc.remaining,
              [resourceType]: (acc.remaining[resourceType] || 0) - paid,
            },
            relicsSpent: acc.relicsSpent + cost[resourceType] - paid,
          }))
          .value(),
      { remaining: { ...hand }, relicsSpent: 0 },
    ),
  )
    .thru(({ remaining, relicsSpent }) => ({
      ...remaining,
      RELIC: (remaining.RELIC || 0) - relicsSpent,
    }))
    .value();
