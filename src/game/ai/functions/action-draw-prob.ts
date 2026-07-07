import type { ActionType, GameState } from '@/game/types';
import { expectedActionCopies } from './expected-action-copies';

export function actionDrawProb(s: GameState, t: ActionType): number {
  return Math.min(0.85, expectedActionCopies(s, t) * 0.6);
}
