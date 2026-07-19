import { match } from 'ts-pattern';

import { getAiState } from '../state';
import { nullish } from '../utils/p';
import type { StrategyKind } from './plan-types';

export const applyStickiness = (
  scores: Record<StrategyKind, number>,
  prevKind: StrategyKind | null,
): Record<StrategyKind, number> =>
  match(prevKind)
    .with(nullish, () => scores)
    .otherwise((kind) => ({
      ...scores,
      [kind]: scores[kind] * getAiState().weights.planStickiness,
    }));
