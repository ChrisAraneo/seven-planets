import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import { canAfford, CARDS, RESOURCE_TYPES } from '@seven-planets/game';
import { computeBuildingCost } from '@seven-planets/game';
import type {
  InfluenceType,
  Planet,
  Player,
  PoolType,
} from '@seven-planets/game';

import { buildingWorth } from './building-worth';
import { handAfterCost } from './hand-after-cost';
import { hasB } from './has-b';
import { influenceDraftValue } from './influence-draft-value';
import { nextLevelAllowed } from './next-level-allowed';
import { owned } from './owned';
import type { Plan } from './plan-types';
import { computeTotalTroops } from './compute-total-troops';

function garrisonFloor(): number {
  return 2 + Math.min(8, Math.floor(getTurn() / 4));
}

export function ownDraftValue(
  player: Player,
  getDraftPlanet: Planet,
  poolType: PoolType,
  plan: Plan,
): number {
  const def = CARDS[poolType];
  if (def.building) {
    const id = poolType as Parameters<typeof nextLevelAllowed>[2];
    const level = nextLevelAllowed(player, getDraftPlanet, id);
    if (!level) {
      return -1;
    }
    const worth = buildingWorth(player, id, getDraftPlanet, level);
    let eachValue = 1.5 + worth / 6;
    if (plan.buildQueue[0]?.id === id) {
      eachValue += 2;
    } else if (
      plan.buildQueue.some((buildCandidate) => buildCandidate.id === id)
    ) {
      eachValue += 1;
    }
    const head = plan.buildQueue[0];
    if (head && head.id !== id && canAfford(player.hand, head.cost)) {
      const after = handAfterCost(player.hand, computeBuildingCost(id, level));
      if (!canAfford(after, head.cost)) {
        eachValue -= 2;
      }
    }
    return eachValue;
  }
  if (def.influenceCard) {
    return influenceDraftValue(player, poolType as InfluenceType, plan);
  }
  if (poolType === 'ATTACK') {
    if (player.hasPacifistStatus) {
      return -1;
    }
    let innerValue = 1.2;
    if (
      (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
      hasB(player, 'SILO')
    ) {
      innerValue += 1.6;
    }
    if (
      (player.hand.ATTACK || 0) === 0 &&
      hasB(player, 'SILO') &&
      computeTotalTroops(player) >= 4
    ) {
      innerValue += 1;
    }
    return innerValue - (player.hand.ATTACK || 0) * 0.5;
  }
  if (poolType === 'RECRUIT') {
    let valueValue = 1.3;
    if (
      hasB(player, 'BARRACKS') &&
      owned(player).some((planet) => planet.troops < garrisonFloor())
    ) {
      valueValue += 1.5;
    }
    valueValue += Math.min(2.5, plan.threat * 0.4);
    if (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') {
      valueValue += 1.6;
    }
    return valueValue - (player.hand.RECRUIT || 0) * 0.4;
  }
  if (poolType === 'MOVE') {
    let moveValue = 0.8;
    if (owned(player).length >= 2 && hasB(player, 'SPACEPORT')) {
      moveValue += 0.8;
    }
    return moveValue - (player.hand.MOVE || 0) * 0.6;
  }
  if (poolType === 'TRADE') {
    let tradeValue = 1;
    if (hasB(player, 'EMBASSY')) {
      tradeValue += 0.6;
    }
    return tradeValue - (player.hand.TRADE || 0) * 0.5;
  }
  let resourceValue = def.value;
  const head = plan.buildQueue[0];
  if (head && (head.cost[poolType] || 0) > (player.hand[poolType] || 0)) {
    resourceValue += 1.6;
  }
  if (
    (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') &&
    poolType === 'ORE'
  ) {
    resourceValue += 0.8;
  }
  if (poolType === 'RELIC') {
    resourceValue += 0.3;
  }
  return resourceValue - Math.min(1.5, (player.hand[poolType] || 0) * 0.08);
}
