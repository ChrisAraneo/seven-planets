import { CARDS, RESOURCE_TYPES } from '@seven-planets/game';
import type { Cost, Player } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computeAverageStrength } from './compute-average-strength';
import type { Plan } from './plan-types';
import { computePlayerStrength } from './compute-player-strength';

export function getTradeOffer(
  player: Player,
  plan: Plan,
): { partner: Player; gives: Cost; gets: Cost } | null {
  const head = plan.buildQueue[0];
  let wantedResource: string | null = null;
  if (head) {
    wantedResource =
      RESOURCE_TYPES.find(
        (resourceType) =>
          resourceType !== 'RELIC' &&
          (head.cost[resourceType] || 0) > (player.hand[resourceType] || 0),
      ) ?? null;
  }
  if (
    !wantedResource &&
    (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') &&
    (player.hand.ORE || 0) < 3
  ) {
    wantedResource = 'ORE';
  }
  if (!wantedResource) {
    return null;
  }
  const reserved: Cost = {};
  if (head) {
    for (const resourceType in head.cost) {
      reserved[resourceType] = head.cost[resourceType];
    }
  }
  const surplus: string[] = [];
  for (const resourceType of RESOURCE_TYPES) {
    if (resourceType === 'RELIC' || resourceType === wantedResource) {
      continue;
    }
    const spare =
      (player.hand[resourceType] || 0) - (reserved[resourceType] || 0);
    for (let index = 0; index < spare; index++) {
      surplus.push(resourceType);
    }
  }
  surplus.sort(
    (firstType, secondType) => CARDS[firstType].value - CARDS[secondType].value,
  );
  const gives: Cost = {};
  let givenValue = 0;
  const targetValue = CARDS[wantedResource].value * 1.25;
  for (const resourceType of surplus) {
    if (givenValue >= targetValue) {
      break;
    }
    gives[resourceType] = (gives[resourceType] || 0) + 1;
    givenValue += CARDS[resourceType].value;
  }
  if (givenValue < targetValue) {
    return null;
  }
  const averageStrength = computeAverageStrength();
  const partners = getAlivePlayers()
    .filter(
      (rival) =>
        rival.id !== player.id && (rival.hand[wantedResource] || 0) > 0,
    )
    .sort(
      (firstRival, secondRival) =>
        computePlayerStrength(firstRival) - computePlayerStrength(secondRival),
    );
  const partner =
    partners.find(
      (rival) => computePlayerStrength(rival) < averageStrength * 1.3,
    ) ?? partners[0];
  if (!partner) {
    return null;
  }
  return { partner, gives, gets: { [wantedResource]: 1 } };
}
