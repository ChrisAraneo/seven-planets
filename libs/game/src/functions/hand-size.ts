import { CARD_TYPES } from '../config/constants';
import type { Player } from '../interfaces/player';

export function handSize(player: Player): number {
  return CARD_TYPES.reduce((s, t) => s + player.hand[t], 0);
}
