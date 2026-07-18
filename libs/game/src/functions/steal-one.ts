import { match } from 'ts-pattern';

import { CARD_TYPES } from '../config/constants';
import { chain } from '../utils/chain';
import { choice } from './choice';
import type { LootProgress } from './steal-cards';

export const steal1 = (loot: LootProgress): LootProgress =>
  match(CARD_TYPES.filter((cardType) => loot.fromHand[cardType] > 0))
    .when(
      (avail) => avail.length === 0,
      () => loot,
    )
    .otherwise((avail) =>
      chain(
        choice(
          avail.flatMap((cardType) =>
            Array.from({ length: loot.fromHand[cardType] }, () => cardType),
          ),
        ),
      )
        .thru((cardType) => ({
          fromHand: {
            ...loot.fromHand,
            [cardType]: loot.fromHand[cardType] - 1,
          },
          toHand: { ...loot.toHand, [cardType]: loot.toHand[cardType] + 1 },
          taken: {
            ...loot.taken,
            [cardType]: (loot.taken[cardType] || 0) + 1,
          },
        }))
        .value(),
    );
