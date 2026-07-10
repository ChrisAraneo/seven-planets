import { CARD_TYPES } from '@/game/config/constants';
import type { Player } from '@/game/types';

export function handSize(player: Player): number {
  return CARD_TYPES.reduce((s, t) => s + player.hand[t], 0);
}
