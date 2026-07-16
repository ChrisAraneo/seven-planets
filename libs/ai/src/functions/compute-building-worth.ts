import { getGameStateLastValue } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import {
  BASE_ROCKET_CAP,
  computeBuildingCost,
  BUILDINGS,
  CARDS,
  computeHandValue,
  computeIncomeAmount,
  getMaxLevel,
  SHIELD_DEFENSE,
  SILO_HIT_BONUS,
  SINGULARITY_DEF_BONUS,
} from '@seven-planets/game';
import { computeRecruitYield } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import type { BuildingType, Planet, Player } from '@seven-planets/game';

import { STAR_VALUE } from './ai-constants';
import { computeAverageResourceCardValue } from './compute-average-resource-card-value';
import { hasBuilding } from './has-building';
import { computeHoldProbability } from './compute-hold-probability';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { getOwnedPlanets } from './get-owned-planets';
import { computePlanetValue } from './compute-planet-value';
import { computeTotalTroops } from './compute-total-troops';
import { isUnderTruce } from './is-under-truce';
import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';

export function computeBuildingWorth(
  player: Player,
  buildingType: BuildingType,
  planet: Planet,
  level: number,
): number {
  const aiState = getAiState();
  const roiHorizon = aiState.W.buildRoiHorizon;
  const costValue = computeHandValue(computeBuildingCost(buildingType, level));
  let grossValue = 0;
  const incomeResource = BUILDINGS[buildingType].income;
  if (incomeResource) {
    const liquidity =
      incomeResource === 'SPICE' ? (hasBuilding(player, 'LAB') ? 0.6 : 0.3) : 1;
    grossValue +=
      (computeIncomeAmount(buildingType, level) -
        computeIncomeAmount(buildingType, level - 1)) *
      CARDS[incomeResource].value *
      roiHorizon *
      liquidity;
  }
  switch (buildingType) {
    case 'BARRACKS': {
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
      break;
    }
    case 'SILO': {
      if (player.hasPacifistStatus) {
        break;
      }
      grossValue += hasBuilding(player, 'SILO')
        ? 2 + SILO_HIT_BONUS * 0.8 + level
        : roiHorizon * 0.7 + getTurn() / 10;
      if (planet.buildings.BARRACKS) {
        grossValue += 3;
      }
      if (hasBuilding(player, 'SILO')) {
        let minimumTroopsNeeded = Infinity;
        for (const targetPlanet of getGameStateLastValue().planets) {
          if (
            targetPlanet.ownerId === player.id ||
            !getPlayerByIndex(targetPlanet.ownerId)?.isAlive ||
            isUnderTruce(targetPlanet)
          ) {
            continue;
          }
          minimumTroopsNeeded = Math.min(
            minimumTroopsNeeded,
            computeMinimumTroopsToConquer(targetPlanet.troops),
          );
        }
        const newCapacity =
          level >= 3 ? Infinity : BASE_ROCKET_CAP * 2 ** level;
        if (
          minimumTroopsNeeded !== Infinity &&
          getRocketCapacity(planet) < minimumTroopsNeeded &&
          newCapacity >= minimumTroopsNeeded
        ) {
          grossValue += 7;
        }
      }
      break;
    }
    case 'SHIELD': {
      const risk = 1 - computeHoldProbability(player, planet, planet.troops);
      // Marginal defense of THIS level-up (+4/+4/+8 for L1/L2/L3).
      grossValue +=
        (SHIELD_DEFENSE[level] - SHIELD_DEFENSE[level - 1]) * 0.35 +
        risk * computePlanetValue(planet) * 0.6;
      break;
    }
    case 'SPACEPORT': {
      grossValue +=
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
      break;
    }
    case 'EMBASSY': {
      grossValue += level === 1 ? 3.5 : STAR_VALUE * roiHorizon * 0.7;
      break;
    }
    case 'LAB': {
      grossValue += level <= getMaxLevel('SINGULARITY') ? 6 + level : 1;
      break;
    }
    case 'SINGULARITY': {
      grossValue += computeAverageResourceCardValue() * roiHorizon + 5;
      if (level >= 4) {
        grossValue += SINGULARITY_DEF_BONUS * 0.6;
      }
      break;
    }
  }
  return grossValue - costValue;
}
