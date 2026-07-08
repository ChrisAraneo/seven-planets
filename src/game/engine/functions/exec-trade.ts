import { fmtCards } from '@/game/constants';
import type { Cost, GameState, Player } from '@/game/types';
import { log } from './log';
import { spendActionCard } from './spend-action-card';

// `a` is the initiator and pays the TRADE action card.
export function execTrade(
  state: GameState,
  a: Player,
  b: Player,
  aGives: Cost,
  bGives: Cost,
): void {
  spendActionCard(a, 'TRADE');
  for (const t in aGives) {
    a.hand[t] -= aGives[t];
    b.hand[t] += aGives[t];
  }
  for (const t in bGives) {
    b.hand[t] -= bGives[t];
    a.hand[t] += bGives[t];
  }
  a.influence++;
  log(
    state,
    `🔁 ${a.name} trades ${fmtCards(aGives)} to ${b.name} for ${fmtCards(bGives)}  [+1⭐ influence]`,
    'trade',
  );
}
