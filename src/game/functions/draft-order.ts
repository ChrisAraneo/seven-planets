import type { GameState, Player } from '@/game/types';

import { techLevel } from '@/game/functions/tech-level';
import { turnOrder } from './turn-order';

// Draft priority: higher TECHNOLOGY drafts first. Ties keep the rotation order.
export function draftOrder(state: GameState): Player[] {
  return turnOrder(state).sort(
    (a, b) => techLevel(state, b) - techLevel(state, a),
  );
}
