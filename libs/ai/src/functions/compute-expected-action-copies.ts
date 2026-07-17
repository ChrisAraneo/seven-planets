import type { ActionType } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import {
  ACTION_CARDS_FROM_TURN,
  CARDS,
  MOVE_CARDS_FROM_TURN,
} from '@seven-planets/game';

export function computeExpectedActionCopies(actionType: ActionType): number {
  if (getTurn() < ACTION_CARDS_FROM_TURN) {
    return 0;
  }
  const actionTypes: ActionType[] = ['ATTACK', 'RECRUIT', 'TRADE'];
  if (getTurn() >= MOVE_CARDS_FROM_TURN) {
    actionTypes.push('MOVE');
  }
  if (!actionTypes.includes(actionType)) {
    return 0;
  }
  const totalWeight = actionTypes.reduce(
    (sum, eachActionType) => sum + CARDS[eachActionType].weight,
    0,
  );
  return (6 * CARDS[actionType].weight) / totalWeight;
}
