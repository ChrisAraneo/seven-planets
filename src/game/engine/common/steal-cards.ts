import { CARD_TYPES, choice } from '@/game/constants';
import type { Hand, Player } from '@/game/types';

export function stealCards(from: Player, to: Player, number: number): Hand {
  const taken: Hand = {};

  for (let i = 0; i < number; i++) {
    const avail = CARD_TYPES.filter((t) => from.hand[t] > 0);

    if (avail.length === 0) {
      break;
    }

    // Weight by count so the loot reflects the victim's stash
    const flat: string[] = [];

    for (const t of avail) {
      for (let k = 0; k < from.hand[t]; k++) {
        flat.push(t);
      }
    }
    const t = choice(flat);

    from.hand[t]--;
    to.hand[t]++;
    taken[t] = (taken[t] || 0) + 1;
  }

  return taken;
}
