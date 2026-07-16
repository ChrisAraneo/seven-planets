import type { ActionType } from '@seven-planets/game';

import { computeExpectedActionCopies } from './compute-expected-action-copies';

export function computeActionDrawProbability(actionType: ActionType): number {
  return Math.min(0.85, computeExpectedActionCopies(actionType) * 0.6);
}
