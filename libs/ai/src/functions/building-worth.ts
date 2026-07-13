import { getGameStateLastValue } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import {
  BASE_ROCKET_CAP,
  buildingCost,
  BUILDINGS,
  CARDS,
  handValue,
  incomeAmount,
  maxLevel,
  SHIELD_DEFENSE,
  SILO_HIT_BONUS,
  SINGULARITY_DEF_BONUS,
} from '@seven-planets/game';
import { recruitYield } from '@seven-planets/game';
import { rocketCap } from '@seven-planets/game';
import type { BuildingType, Planet, Player } from '@seven-planets/game';

import { avgResourceCardValue } from './avg-resource-card-value';
import { hasB } from './has-b';
import { holdProbability } from './hold-probability';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { owned } from './owned';
import { planetValue } from './planet-value';
import { totalTroops } from './total-troops';
import { isUnderTruce } from './is-under-truce';

export function buildingWorth(
  player: Player,
  id: BuildingType,
  planet: Planet,
  level: number,
): number {
  const aiState = getAiState();
  const H = aiState.W.buildRoiHorizon;
  const costVal = handValue(buildingCost(id, level));
  let gross = 0;
  const inc = BUILDINGS[id].income;
  if (inc) {
    const liquidity = inc === 'SPICE' ? (hasB(player, 'LAB') ? 0.6 : 0.3) : 1;
    gross +=
      (incomeAmount(id, level) - incomeAmount(id, level - 1)) *
      CARDS[inc].value *
      H *
      liquidity;
  }
  switch (id) {
    case 'BARRACKS': {
      if (!hasB(player, 'BARRACKS')) {
        gross += H + 6;
      } else if (level === 1) {
        gross += 3;
      } else {
        const delta =
          recruitYield({ ...planet, buildings: { BARRACKS: level } }) -
          recruitYield(planet);
        gross += delta * H * 0.5;
      }
      if (planet.buildings.SILO) {
        gross += 3;
      }
      break;
    }
    case 'SILO': {
      if (player.hasPacifistStatus) {
        break;
      }
      gross += hasB(player, 'SILO')
        ? 2 + SILO_HIT_BONUS * 0.8 + level
        : H * 0.7 + getTurn() / 10;
      if (planet.buildings.BARRACKS) {
        gross += 3;
      }
      if (hasB(player, 'SILO')) {
        let minNeed = Infinity;
        for (const eachPlanet of getGameStateLastValue().planets) {
          if (
            eachPlanet.ownerId === player.id ||
            !getGameStateLastValue().players[eachPlanet.ownerId].isAlive ||
            isUnderTruce(eachPlanet)
          ) {
            continue;
          }
          minNeed = Math.min(minNeed, minTroopsToConquer(eachPlanet.troops));
        }
        const newCap = level >= 3 ? Infinity : BASE_ROCKET_CAP * 2 ** level;
        if (
          minNeed !== Infinity &&
          rocketCap(planet) < minNeed &&
          newCap >= minNeed
        ) {
          gross += 7;
        }
      }
      break;
    }
    case 'SHIELD': {
      const risk = 1 - holdProbability(player, planet, planet.troops);
      gross += SHIELD_DEFENSE * 0.35 + risk * planetValue(planet) * 0.6;
      break;
    }
    case 'SPACEPORT': {
      gross += owned(player).length >= 2 ? (level === 1 ? 4 : 2.5) : 0.5;
      if (!hasB(player, 'SPACEPORT') && owned(player).length >= 2) {
        const silos = owned(player).filter((planet) => planet.buildings.SILO);
        if (silos.length > 0) {
          const staged = silos.reduce(
            (candidate, planet) => Math.max(candidate, planet.troops),
            0,
          );
          gross += Math.min(6, (totalTroops(player) - staged) * 0.4);
        }
      }
      break;
    }
    case 'EMBASSY': {
      const STAR_VALUE = 0.8;
      gross += level === 1 ? 3.5 : STAR_VALUE * H * 0.7;
      break;
    }
    case 'LAB': {
      gross += level <= maxLevel('SINGULARITY') ? 6 + level : 1;
      break;
    }
    case 'SINGULARITY': {
      gross += avgResourceCardValue() * H + 5;
      if (level >= 4) {
        gross += SINGULARITY_DEF_BONUS * 0.6;
      }
      break;
    }
  }
  return gross - costVal;
}
