import { chain } from '../utils/chain';
import type { PaymentProgress } from './pay-cost';

export const spendFromHand = (
  progress: PaymentProgress,
  type: string,
  amount: number,
): PaymentProgress =>
  chain(Math.min(progress.hand[type], amount))
    .thru((use) => ({
      hand: { ...progress.hand, [type]: progress.hand[type] - use },
      relicsNeeded: progress.relicsNeeded + (amount - use),
    }))
    .value();
