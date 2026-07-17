import type { Cost, Player } from '@seven-planets/game';
import { CARDS, RESOURCE_TYPES } from '@seven-planets/game';

import { getAlivePlayers } from '../../../game/src/getters/get-alive-players';
import { computeAverageStrength } from './compute-average-strength';
import { computePlayerStrength } from './compute-player-strength';
import type { BuildCandidate } from './get-build-candidates';
import type { Plan } from './plan-types';

export function getTradeOffer(
  player: Player,
  plan: Plan,
): { partner: Player; gives: Cost; gets: Cost } | null {
  const head = plan.buildQueue.at(0);
  const wantedResource = findWantedResource(player, plan, head);
  if (!wantedResource) {
    return null;
  }
  const gives = buildGives(player, head, wantedResource);
  if (!gives) {
    return null;
  }
  const partner = findPartner(player, wantedResource);
  if (!partner) {
    return null;
  }
  return { partner, gives, gets: { [wantedResource]: 1 } };
}

function findWantedResource(
  player: Player,
  plan: Plan,
  head: BuildCandidate | undefined,
): string | null {
  const goalShortfall = head
    ? (RESOURCE_TYPES.find(
        (resourceType) =>
          resourceType !== 'RELIC' &&
          (head.cost[resourceType] || 0) > (player.hand[resourceType] || 0),
      ) ?? null)
    : null;
  if (goalShortfall) {
    return goalShortfall;
  }
  return (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') &&
    (player.hand.ORE || 0) < 3
    ? 'ORE'
    : null;
}

function collectSurplus(
  player: Player,
  head: BuildCandidate | undefined,
  wantedResource: string,
): string[] {
  const reserved: Cost = { ...head?.cost };
  const surplus: string[] = [];
  for (const resourceType of RESOURCE_TYPES) {
    if (resourceType !== 'RELIC' && resourceType !== wantedResource) {
      const spare =
        (player.hand[resourceType] || 0) - (reserved[resourceType] || 0);
      for (let index = 0; index < spare; index++) {
        surplus.push(resourceType);
      }
    }
  }
  return surplus.toSorted(
    (firstType, secondType) => CARDS[firstType].value - CARDS[secondType].value,
  );
}

function buildGives(
  player: Player,
  head: BuildCandidate | undefined,
  wantedResource: string,
): Cost | null {
  const gives: Cost = {};
  let givenValue = 0;
  const targetValue = CARDS[wantedResource].value * 1.25;
  for (const resourceType of collectSurplus(player, head, wantedResource)) {
    if (givenValue >= targetValue) {
      break;
    }
    gives[resourceType] = (gives[resourceType] || 0) + 1;
    givenValue += CARDS[resourceType].value;
  }
  return givenValue < targetValue ? null : gives;
}

function findPartner(player: Player, wantedResource: string): Player | null {
  const averageStrength = computeAverageStrength();
  const partners = getAlivePlayers()
    .filter(
      (rival) =>
        rival.id !== player.id && (rival.hand[wantedResource] || 0) > 0,
    )
    .toSorted(
      (firstRival, secondRival) =>
        computePlayerStrength(firstRival) - computePlayerStrength(secondRival),
    );
  return (
    partners.find(
      (rival) => computePlayerStrength(rival) < averageStrength * 1.3,
    ) ??
    partners.at(0) ??
    null
  );
}
