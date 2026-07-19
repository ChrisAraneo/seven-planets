import type { ActionType } from '@seven-planets/game';

import { computeExpectedActionCopies } from './compute-expected-action-copies';

export const computeActionDrawProbability = (actionType: ActionType): number =>
  Math.min(0.85, computeExpectedActionCopies(actionType) * 0.6);
