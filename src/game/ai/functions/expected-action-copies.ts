import {
  ACTION_CARDS_FROM_TURN,
  CARDS,
  MOVE_CARDS_FROM_TURN,
} from '@/game/constants';
import type { ActionType } from '@/game/types';
import { getGameState } from '@/stores/game-state';

export function expectedActionCopies(t: ActionType): number {
  const s = getGameState();
  if (s.turn < ACTION_CARDS_FROM_TURN) {
    return 0;
  }
  const types: ActionType[] = ['ATTACK', 'RECRUIT', 'TRADE'];
  if (s.turn >= MOVE_CARDS_FROM_TURN) {
    types.push('MOVE');
  }
  if (!types.includes(t)) {
    return 0;
  }
  const total = types.reduce((x, a) => x + CARDS[a].weight, 0);
  return (6 * CARDS[t].weight) / total;
}
