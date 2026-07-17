import type {
  BuildingType,
  Planet,
  Player,
  PoolType,
} from '@seven-planets/game';
import {
  canAfford,
  CARDS,
  isBuildingType,
  isInfluenceType,
} from '@seven-planets/game';
import { computeBuildingCost } from '@seven-planets/game';

import { computeBuildingWorth } from './compute-building-worth';
import { computeGarrisonFloor } from './compute-garrison-floor';
import { computeHandAfterCost } from './compute-hand-after-cost';
import { computeInfluenceDraftValue } from './compute-influence-draft-value';
import { computeTotalTroops } from './compute-total-troops';
import { getNextAllowedLevel } from './get-next-allowed-level';
import { getOwnedPlanets } from './get-owned-planets';
import { hasBuilding } from './has-building';
import type { Plan } from './plan-types';

export const computeOwnDraftValue = (
  player: Player,
  draftPlanet: Planet,
  poolType: PoolType,
  plan: Plan,
): number => {
  const cardDefinition = CARDS[poolType];
  if (isBuildingType(poolType)) {
    return computeBuildingDraftValue(player, draftPlanet, poolType, plan);
  }
  if (isInfluenceType(poolType)) {
    return computeInfluenceDraftValue(player, poolType, plan);
  }
  switch (poolType) {
    case 'ATTACK': {
      return computeAttackDraftValue(player, plan);
    }
    case 'RECRUIT': {
      return computeRecruitDraftValue(player, plan);
    }
    case 'MOVE': {
      return computeMoveDraftValue(player);
    }
    case 'TRADE': {
      return computeTradeDraftValue(player);
    }
    default: {
      return computeResourceDraftValue(
        player,
        poolType,
        plan,
        cardDefinition.value,
      );
    }
  }
};

const computeBuildingDraftValue = (
  player: Player,
  draftPlanet: Planet,
  buildingType: BuildingType,
  plan: Plan,
): number => {
  const level = getNextAllowedLevel(player, draftPlanet, buildingType);
  if (!level) {
    return -1;
  }
  const worth = computeBuildingWorth(player, buildingType, draftPlanet, level);
  let value = 1.5 + worth / 6;
  if (plan.buildQueue.at(0)?.id === buildingType) {
    value += 2;
  } else if (
    plan.buildQueue.some((candidate) => candidate.id === buildingType)
  ) {
    value += 1;
  }
  const head = plan.buildQueue.at(0);
  if (head && head.id !== buildingType && canAfford(player.hand, head.cost)) {
    const remainingHand = computeHandAfterCost(
      player.hand,
      computeBuildingCost(buildingType, level),
    );
    if (!canAfford(remainingHand, head.cost)) {
      value -= 2;
    }
  }
  return value;
};

const computeAttackDraftValue = (player: Player, plan: Plan): number => {
  if (player.hasPacifistStatus) {
    return -1;
  }
  let attackValue = 1.2;
  if (
    (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
    hasBuilding(player, 'SILO')
  ) {
    attackValue += 1.6;
  }
  if (
    (player.hand.ATTACK || 0) === 0 &&
    hasBuilding(player, 'SILO') &&
    computeTotalTroops(player) >= 4
  ) {
    attackValue += 1;
  }
  return attackValue - (player.hand.ATTACK || 0) * 0.5;
};

const computeRecruitDraftValue = (player: Player, plan: Plan): number => {
  let recruitValue = 1.3;
  if (
    hasBuilding(player, 'BARRACKS') &&
    getOwnedPlanets(player).some(
      (planet) => planet.troops < computeGarrisonFloor(),
    )
  ) {
    recruitValue += 1.5;
  }
  recruitValue += Math.min(2.5, plan.threat * 0.4);
  if (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') {
    recruitValue += 1.6;
  }
  return recruitValue - (player.hand.RECRUIT || 0) * 0.4;
};

const computeMoveDraftValue = (player: Player): number => {
  let moveValue = 0.8;
  if (getOwnedPlanets(player).length >= 2 && hasBuilding(player, 'SPACEPORT')) {
    moveValue += 0.8;
  }
  return moveValue - (player.hand.MOVE || 0) * 0.6;
};

const computeTradeDraftValue = (player: Player): number => {
  let tradeValue = 1;
  if (hasBuilding(player, 'EMBASSY')) {
    tradeValue += 0.6;
  }
  return tradeValue - (player.hand.TRADE || 0) * 0.5;
};

const computeResourceDraftValue = (
  player: Player,
  poolType: PoolType,
  plan: Plan,
  baseValue: number,
): number => {
  let resourceValue = baseValue;
  const head = plan.buildQueue.at(0);
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
};
