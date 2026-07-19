import type { Cost } from '../interfaces/cost';
import type { Hand } from '../interfaces/hand';

export const canAfford = (hand: Hand, cost: Cost): boolean =>
  Object.entries(cost).reduce(
    (shortfall, [type, amount]) =>
      shortfall + Math.max(0, amount - (hand[type] || 0)),
    0,
  ) <=
  (hand.RELIC || 0) - (cost.RELIC || 0);
