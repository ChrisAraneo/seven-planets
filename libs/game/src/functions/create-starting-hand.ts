import { fromPairs } from 'lodash-es';

import { CARD_TYPES, INFLUENCE_TYPES } from '../config/constants';
import type { Hand } from '../interfaces/hand';

export const createStartingHand = (): Hand =>
  fromPairs(
    [...CARD_TYPES, ...INFLUENCE_TYPES].map((cardType) => [cardType, 0]),
  );
