import { CARD_TYPES } from '../config/constants';
import type { Player } from '../interfaces/player';

export const getHandSize = (player: Player): number =>
  CARD_TYPES.reduce((sum, cardType) => sum + player.hand[cardType], 0);
