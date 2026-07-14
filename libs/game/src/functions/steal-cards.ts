import { range } from 'lodash-es';
import { chain } from '../utils/chain';
import { match } from 'ts-pattern';
import { CARD_TYPES, choice } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Hand } from '../interfaces/hand';

import { updatePlayer } from './update-player';

interface LootProgress {
  fromHand: Hand;
  toHand: Hand;
  taken: Hand;
}

// Loot `number` random cards from one player to another, weighted by the victim's
// stash. Pure: returns the new state plus the `taken` tally (used in war logs).
export function stealCards(
  state: GameState,
  fromId: number,
  toId: number,
  number: number,
): { state: GameState; taken: Hand } {
  return chain(range(number))
    .reduce((loot: LootProgress) => stealOne(loot), {
      fromHand: { ...state.players[fromId].hand },
      toHand: { ...state.players[toId].hand },
      taken: {},
    })
    .thru(({ fromHand, toHand, taken }) => ({
      state: updatePlayer(
        updatePlayer(state, fromId, (player) => ({
          ...player,
          hand: fromHand,
        })),
        toId,
        (player) => ({ ...player, hand: toHand }),
      ),
      taken,
    }))
    .value();
}

function stealOne(loot: LootProgress): LootProgress {
  return match(CARD_TYPES.filter((cardType) => loot.fromHand[cardType] > 0))
    .when(
      (avail) => avail.length === 0,
      () => loot,
    )
    .otherwise((avail) =>
      // Weight by count so the loot reflects the victim's stash
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
          taken: { ...loot.taken, [cardType]: (loot.taken[cardType] || 0) + 1 },
        }))
        .value(),
    );
}
