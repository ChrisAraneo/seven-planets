import { match } from 'ts-pattern';

import { CARD_TYPES } from '../config/constants';
import { CARDS } from '../config/constants';
import type { Cost } from '../interfaces/cost';
import type { Hand } from '../interfaces/hand';

export const formatCards = (cards: Hand | Cost): string =>
  match(
    CARD_TYPES.filter((cardType) => (cards[cardType] || 0) > 0).map(
      (cardType) => `${cards[cardType]}${CARDS[cardType].icon}`,
    ),
  )
    .when(
      (parts) => parts.length > 0,
      (parts) => parts.join(' '),
    )
    .otherwise(() => 'nothing');
