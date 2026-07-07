import { CARD_TYPES } from '@/game/constants';
import type { Player } from '@/game/types';

export function handSize(p: Player): number {
  return CARD_TYPES.reduce((s, t) => s + p.hand[t], 0);
}
