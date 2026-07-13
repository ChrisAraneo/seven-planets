import type { ActionType } from '@seven-planets/game';

import { expectedActionCopies } from './expected-action-copies';

export function actionDrawProb(actionType: ActionType): number {
  return Math.min(0.85, expectedActionCopies(actionType) * 0.6);
}
