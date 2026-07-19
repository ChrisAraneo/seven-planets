import { CARD_TYPES } from '../config/constants';
import { CARDS } from '../config/constants';
import type { Cost } from '../interfaces/cost';
import type { Hand } from '../interfaces/hand';

export const computeHandValue = (map: Hand | Cost): number =>
  CARD_TYPES.reduce(
    (sum, cardType) => sum + (map[cardType] || 0) * CARDS[cardType].value,
    0,
  );
