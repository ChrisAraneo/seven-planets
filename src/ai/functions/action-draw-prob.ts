import type { ActionType } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { expectedActionCopies } from './expected-action-copies';

export function actionDrawProb(t: ActionType): number {
  const s = getGameState();
  return Math.min(0.85, expectedActionCopies(t) * 0.6);
}
