import { chain, range } from 'lodash-es';
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
        updatePlayer(state, fromId, (p) => ({ ...p, hand: fromHand })),
        toId,
        (p) => ({ ...p, hand: toHand }),
      ),
      taken,
    }))
    .value();
}

function stealOne(loot: LootProgress): LootProgress {
  return match(CARD_TYPES.filter((t) => loot.fromHand[t] > 0))
    .when(
      (avail) => avail.length === 0,
      () => loot,
    )
    .otherwise((avail) =>
      // Weight by count so the loot reflects the victim's stash
      chain(
        choice(
          avail.flatMap((t) =>
            Array.from({ length: loot.fromHand[t] }, () => t),
          ),
        ),
      )
        .thru((t) => ({
          fromHand: { ...loot.fromHand, [t]: loot.fromHand[t] - 1 },
          toHand: { ...loot.toHand, [t]: loot.toHand[t] + 1 },
          taken: { ...loot.taken, [t]: (loot.taken[t] || 0) + 1 },
        }))
        .value(),
    );
}
