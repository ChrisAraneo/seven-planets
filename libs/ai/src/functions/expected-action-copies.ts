import { getTurn } from '@seven-planets/game';
import {
  ACTION_CARDS_FROM_TURN,
  CARDS,
  MOVE_CARDS_FROM_TURN,
} from '@seven-planets/game';
import type { ActionType } from '@seven-planets/game';

export function expectedActionCopies(actionType: ActionType): number {
  if (getTurn() < ACTION_CARDS_FROM_TURN) {
    return 0;
  }
  const types: ActionType[] = ['ATTACK', 'RECRUIT', 'TRADE'];
  if (getTurn() >= MOVE_CARDS_FROM_TURN) {
    types.push('MOVE');
  }
  if (!types.includes(actionType)) {
    return 0;
  }
  const total = types.reduce(
    (candidate, actionType) => candidate + CARDS[actionType].weight,
    0,
  );
  return (6 * CARDS[actionType].weight) / total;
}
