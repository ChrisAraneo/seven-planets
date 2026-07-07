import type { Player } from '@/game/types';
import { techLevel } from './tech-level';
import { turnOrder } from './turn-order';

// Draft priority: higher TECHNOLOGY drafts first. Ties keep the rotation order.
export function draftOrder(): Player[] {
  return turnOrder().sort((a, b) => techLevel(b) - techLevel(a));
}
