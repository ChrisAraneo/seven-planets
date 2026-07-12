import { canAfford, CARDS, RESOURCE_TYPES } from '@seven-planets/game';
import type { Cost, Player } from '@seven-planets/game';

import { alive } from './alive';
import { avgStrength } from './avg-strength';
import { hasB } from './has-b';
import { incomePerTurn } from './income-per-turn';
import { planFor } from './plan-for';
import { playerStrength } from './player-strength';

export function planTradeOffer(
  player: Player,
  plan: ReturnType<typeof planFor>,
): { partner: Player; gives: Cost; gets: Cost } | null {
  const head = plan.buildQueue[0];
  let want: string | null = null;
  if (head) {
    want =
      RESOURCE_TYPES.find(
        (resourceType) =>
          resourceType !== 'RELIC' &&
          (head.cost[resourceType] || 0) > (player.hand[resourceType] || 0),
      ) ?? null;
  }
  if (
    !want &&
    (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') &&
    (player.hand.ORE || 0) < 3
  ) {
    want = 'ORE';
  }
  if (!want) {
    return null;
  }
  const reserved: Cost = {};
  if (head) {
    for (const type in head.cost) {
      reserved[type] = head.cost[type];
    }
  }
  const surplus: string[] = [];
  for (const resourceType of RESOURCE_TYPES) {
    if (resourceType === 'RELIC' || resourceType === want) {
      continue;
    }
    const spare =
      (player.hand[resourceType] || 0) - (reserved[resourceType] || 0);
    for (let index = 0; index < spare; index++) {
      surplus.push(resourceType);
    }
  }
  surplus.sort((first, building) => CARDS[first].value - CARDS[building].value);
  const gives: Cost = {};
  let eachValue = 0;
  const targetV = CARDS[want].value * 1.25;
  for (const eachType of surplus) {
    if (eachValue >= targetV) {
      break;
    }
    gives[eachType] = (gives[eachType] || 0) + 1;
    eachValue += CARDS[eachType].value;
  }
  if (eachValue < targetV) {
    return null;
  }
  const avg = avgStrength();
  const partners = alive()
    .filter((player) => player.id !== player.id && (player.hand[want] || 0) > 0)
    .sort(
      (player, eachPlayer) =>
        playerStrength(player) - playerStrength(eachPlayer),
    );
  const partner =
    partners.find((player) => playerStrength(player) < avg * 1.3) ??
    partners[0];
  if (!partner) {
    return null;
  }
  return { partner, gives, gets: { [want]: 1 } };
}
