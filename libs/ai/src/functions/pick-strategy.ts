import { match } from 'ts-pattern';

import type { StrategyKind } from './plan-types';

const STRATEGY_KINDS: StrategyKind[] = [
  'DEVELOP',
  'STRIKE',
  'MILITARIZE',
  'FORTIFY',
  'COUP_BANK',
];

export const pickStrategy = (
  scores: Record<StrategyKind, number>,
): StrategyKind =>
  STRATEGY_KINDS.reduce<StrategyKind>(
    (best, strategyKind) =>
      match(scores[strategyKind] > scores[best])
        .with(true, () => strategyKind)
        .otherwise(() => best),
    'DEVELOP',
  );
