import { CARDS, MOVE_CARDS_FROM_TURN } from '../config/constants';
import type { ActionType } from '../interfaces/action-type';
import type { GameState } from '../interfaces/game-state';
import type { PoolType } from '../interfaces/pool-type';

// Draw one action card. Attack/Recruit/Trade from turn 10; Move from turn 20.
export function drawActionCard(state: GameState): PoolType {
  const types: ActionType[] = ['ATTACK', 'RECRUIT', 'TRADE'];
  if (state.turn >= MOVE_CARDS_FROM_TURN) {
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
