import { CARD_TYPES, choice } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Hand } from '../interfaces/hand';

import { updatePlayer } from './update-player';

// Loot `number` random cards from one player to another, weighted by the victim's
// stash. Pure: returns the new state plus the `taken` tally (used in war logs).
export function stealCards(
  state: GameState,
  fromId: number,
  toId: number,
  number: number,
): { state: GameState; taken: Hand } {
  const taken: Hand = {};
  const fromHand = { ...state.players[fromId].hand };
  const toHand = { ...state.players[toId].hand };

  for (let i = 0; i < number; i++) {
    const avail = CARD_TYPES.filter((t) => fromHand[t] > 0);

    if (avail.length === 0) {
      break;
    }

    // Weight by count so the loot reflects the victim's stash
    const flat: string[] = [];

    for (const t of avail) {
      for (let k = 0; k < fromHand[t]; k++) {
        flat.push(t);
      }
    }
    const t = choice(flat);

    fromHand[t]--;
    toHand[t]++;
    taken[t] = (taken[t] || 0) + 1;
  }

  let next = updatePlayer(state, fromId, (p) => ({ ...p, hand: fromHand }));
  next = updatePlayer(next, toId, (p) => ({ ...p, hand: toHand }));

  return { state: next, taken };
}
