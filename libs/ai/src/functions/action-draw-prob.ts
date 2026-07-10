import type { ActionType } from '@seven-planets/game';

import { expectedActionCopies } from './expected-action-copies';

export function actionDrawProb(t: ActionType): number {
  return Math.min(0.85, expectedActionCopies(t) * 0.6);
}
