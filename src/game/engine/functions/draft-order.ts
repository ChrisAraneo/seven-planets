import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { techLevel } from './tech-level';
import { turnOrder } from './turn-order';

// Draft priority: higher TECHNOLOGY drafts first. Ties keep the rotation order.
export function draftOrder(): Player[] {
  const state = getGameState();
  return turnOrder().sort((a, b) => techLevel(b) - techLevel(a));
}
