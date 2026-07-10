import { canAfford, CARDS, RESOURCE_TYPES } from '@seven-planets/game';
import type { Cost, Player } from '@seven-planets/game';

import { alive } from './alive';
import { avgStrength } from './avg-strength';
import { hasB } from './has-b';
import { incomePerTurn } from './income-per-turn';
import { planFor } from './plan-for';
import { playerStrength } from './player-strength';

export function planTradeOffer(
  p: Player,
  plan: ReturnType<typeof planFor>,
): { partner: Player; gives: Cost; gets: Cost } | null {
  const head = plan.buildQueue[0];
  let want: string | null = null;
  if (head) {
    want =
      RESOURCE_TYPES.find(
        (t) => t !== 'RELIC' && (head.cost[t] || 0) > (p.hand[t] || 0),
      ) ?? null;
  }
  if (
    !want &&
    (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') &&
    (p.hand.ORE || 0) < 3
  ) {
    want = 'ORE';
  }
  if (!want) {
    return null;
  }
  const reserved: Cost = {};
  if (head) {
    for (const t in head.cost) {
      reserved[t] = head.cost[t];
    }
  }
  const surplus: string[] = [];
  for (const t of RESOURCE_TYPES) {
    if (t === 'RELIC' || t === want) {
      continue;
    }
    const spare = (p.hand[t] || 0) - (reserved[t] || 0);
    for (let i = 0; i < spare; i++) {
      surplus.push(t);
    }
  }
  surplus.sort((a, b) => CARDS[a].value - CARDS[b].value);
  const gives: Cost = {};
  let v = 0;
  const targetV = CARDS[want].value * 1.25;
  for (const t of surplus) {
    if (v >= targetV) {
      break;
    }
    gives[t] = (gives[t] || 0) + 1;
    v += CARDS[t].value;
  }
  if (v < targetV) {
    return null;
  }
  const avg = avgStrength();
  const partners = alive()
    .filter((x) => x.id !== p.id && (x.hand[want] || 0) > 0)
    .sort((a, b) => playerStrength(a) - playerStrength(b));
  const partner =
    partners.find((x) => playerStrength(x) < avg * 1.3) ?? partners[0];
  if (!partner) {
    return null;
  }
  return { partner, gives, gets: { [want]: 1 } };
}
