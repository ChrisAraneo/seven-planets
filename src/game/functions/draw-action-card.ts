import { getTurn } from '@/game/getters/get-turn';
import { CARDS, MOVE_CARDS_FROM_TURN } from '@/game/config/constants';
import type { ActionType, PoolType } from '@/game/types';

// Draw one action card. Attack/Recruit/Trade from turn 10; Move from turn 20.
export function drawActionCard(): PoolType {
  const types: ActionType[] = ['ATTACK', 'RECRUIT', 'TRADE'];
  if (getTurn() >= MOVE_CARDS_FROM_TURN) {
    types.push('MOVE');
  }
  let total = 0;
  for (const t of types) {
    total += CARDS[t].weight;
  }
  let r = Math.random() * total;
  for (const t of types) {
    r -= CARDS[t].weight;
    if (r < 0) {
      return t;
    }
  }
  return 'ATTACK';
}
