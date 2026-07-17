import type { BuildingType, Planet, Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import {
  BASE_ROCKET_CAP,
  BUILDINGS,
  CARDS,
  computeBuildingCost,
  computeHandValue,
  computeIncomeAmount,
  getMaxLevel,
  SHIELD_DEFENSE,
  SILO_HIT_BONUS,
  SINGULARITY_DEF_BONUS,
} from '@seven-planets/game';
import { computeRecruitYield } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';

import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { getAiState } from '../state';
import { STAR_VALUE } from './ai-constants';
import { computeAverageResourceCardValue } from './compute-average-resource-card-value';
import { computeHoldProbability } from './compute-hold-probability';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computePlanetValue } from './compute-planet-value';
import { computeTotalTroops } from './compute-total-troops';
import { getOwnedPlanets } from './get-owned-planets';
import { hasBuilding } from './has-building';
import { isUnderTruce } from './is-under-truce';

export function computeBuildingWorth(
  player: Player,
  buildingType: BuildingType,
  planet: Planet,
  level: number,
): number {
  const costValue = computeHandValue(computeBuildingCost(buildingType, level));
  const grossValue =
    computeIncomeWorth(player, buildingType, level) +
    computeSpecialWorth(player, buildingType, planet, level);
  return grossValue - costValue;
}

function computeIncomeWorth(
  player: Player,
  buildingType: BuildingType,
  level: number,
): number {
  const incomeResource = BUILDINGS[buildingType].income;
  if (!incomeResource) {
    return 0;
  }
  const roiHorizon = getAiState().W.buildRoiHorizon;
  const liquidity =
    incomeResource === 'SPICE' ? (hasBuilding(player, 'LAB') ? 0.6 : 0.3) : 1;
  return (
    (computeIncomeAmount(buildingType, level) -
      computeIncomeAmount(buildingType, level - 1)) *
    CARDS[incomeResource].value *
    roiHorizon *
    liquidity
  );
}

function computeSpecialWorth(
  player: Player,
  buildingType: BuildingType,
  planet: Planet,
  level: number,
): number {
  switch (buildingType) {
    case 'BARRACKS': {
      return computeBarracksWorth(player, planet, level);
    }
    case 'SILO': {
      return computeSiloWorth(player, planet, level);
    }
    case 'SHIELD': {
      return computeShieldWorth(player, planet, level);
    }
    case 'SPACEPORT': {
      return computeSpaceportWorth(player, level);
    }
    case 'EMBASSY': {
      return level === 1
        ? 3.5
        : STAR_VALUE * getAiState().W.buildRoiHorizon * 0.7;
    }
    case 'LAB': {
      return level <= getMaxLevel('SINGULARITY') ? 6 + level : 1;
    }
    case 'SINGULARITY': {
      return (
        computeAverageResourceCardValue() * getAiState().W.buildRoiHorizon +
        5 +
        (level >= 4 ? SINGULARITY_DEF_BONUS * 0.6 : 0)
      );
    }
    default: {
      return 0;
    }
  }
}

function computeBarracksWorth(
  player: Player,
  planet: Planet,
  level: number,
): number {
  const roiHorizon = getAiState().W.buildRoiHorizon;
  let grossValue = 0;
  if (!hasBuilding(player, 'BARRACKS')) {
    grossValue += roiHorizon + 6;
  } else if (level === 1) {
    grossValue += 3;
  } else {
    const yieldDelta =
      computeRecruitYield({ ...planet, buildings: { BARRACKS: level } }) -
      computeRecruitYield(planet);
    grossValue += yieldDelta * roiHorizon * 0.5;
  }
  if (planet.buildings.SILO) {
    grossValue += 3;
  }
  return grossValue;
}

function computeSiloWorth(
  player: Player,
  planet: Planet,
  level: number,
): number {
  if (player.hasPacifistStatus) {
    return 0;
  }
  const roiHorizon = getAiState().W.buildRoiHorizon;
  let grossValue = hasBuilding(player, 'SILO')
    ? 2 + SILO_HIT_BONUS * 0.8 + level
    : roiHorizon * 0.7 + getTurn() / 10;
  if (planet.buildings.BARRACKS) {
    grossValue += 3;
  }
  if (hasBuilding(player, 'SILO')) {
    grossValue += computeCapacityUnlockWorth(player, planet, level);
  }
  return grossValue;
}

function computeCapacityUnlockWorth(
  player: Player,
  planet: Planet,
  level: number,
): number {
  let minimumTroopsNeeded = Infinity;
  for (const targetPlanet of getGameStateLastValue().planets) {
    const isTargetable =
      targetPlanet.ownerId !== player.id &&
      Boolean(getPlayerByIndex(targetPlanet.ownerId)?.isAlive) &&
      !isUnderTruce(targetPlanet);
    if (isTargetable) {
      minimumTroopsNeeded = Math.min(
        minimumTroopsNeeded,
        computeMinimumTroopsToConquer(targetPlanet.troops),
      );
    }
  }
  const upgradedCapacity = level >= 3 ? Infinity : BASE_ROCKET_CAP * 2 ** level;
  return minimumTroopsNeeded !== Infinity &&
    getRocketCapacity(planet) < minimumTroopsNeeded &&
    upgradedCapacity >= minimumTroopsNeeded
    ? 7
    : 0;
}

function computeShieldWorth(
  player: Player,
  planet: Planet,
  level: number,
): number {
  const risk = 1 - computeHoldProbability(player, planet, planet.troops);
  return (
    (SHIELD_DEFENSE[level] - SHIELD_DEFENSE[level - 1]) * 0.35 +
    risk * computePlanetValue(planet) * 0.6
  );
}

function computeSpaceportWorth(player: Player, level: number): number {
  let grossValue =
    getOwnedPlanets(player).length >= 2 ? (level === 1 ? 4 : 2.5) : 0.5;
  if (
    !hasBuilding(player, 'SPACEPORT') &&
    getOwnedPlanets(player).length >= 2
  ) {
    const silos = getOwnedPlanets(player).filter(
      (ownedPlanet) => ownedPlanet.buildings.SILO,
    );
    if (silos.length > 0) {
      const stagedTroops = silos.reduce(
        (maxTroops, siloPlanet) => Math.max(maxTroops, siloPlanet.troops),
        0,
      );
      grossValue += Math.min(
        6,
        (computeTotalTroops(player) - stagedTroops) * 0.4,
      );
    }
  }
  return grossValue;
}
