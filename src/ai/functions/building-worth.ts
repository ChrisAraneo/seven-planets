import { getAiState } from '@/ai/state';
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
} from '@/game/constants';
import { recruitYield } from '@/game/shared/recruit-yield';
import { rocketCap } from '@/game/shared/rocket-cap';
import type { BuildingType, Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { avgResourceCardValue } from './avg-resource-card-value';
import { hasB } from './has-b';
import { holdProbability } from './hold-probability';
import { minTroopsToConquer } from './min-troops-to-conquer';
import { owned } from './owned';
import { planetValue } from './planet-value';
import { totalTroops } from './total-troops';
import { underTruce } from './under-truce';

export function buildingWorth(
  p: Player,
  id: BuildingType,
  planet: Planet,
  level: number,
): number {
  const aiState = getAiState();
  const s = getGameState();
  const H = aiState.W.buildRoiHorizon;
  const costVal = handValue(buildingCost(id, level));
  let gross = 0;
  const inc = BUILDINGS[id].income;
  if (inc) {
    const liquidity = inc === 'SPICE' ? (hasB(p, 'LAB') ? 0.6 : 0.3) : 1;
    gross +=
      (incomeAmount(id, level) - incomeAmount(id, level - 1)) *
      CARDS[inc].value *
      H *
      liquidity;
  }
  switch (id) {
    case 'BARRACKS': {
      if (!hasB(p, 'BARRACKS')) {
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
      if (p.pacifistStatus) {
        break;
      }
      gross += hasB(p, 'SILO')
        ? 2 + SILO_HIT_BONUS * 0.8 + level
        : H * 0.7 + s.turn / 10;
      if (planet.buildings.BARRACKS) {
        gross += 3;
      }
      if (hasB(p, 'SILO')) {
        let minNeed = Infinity;
        for (const tp of s.planets) {
          if (
            tp.ownerId === p.id ||
            !s.players[tp.ownerId].alive ||
            underTruce(tp)
          ) {
            continue;
          }
          minNeed = Math.min(minNeed, minTroopsToConquer(tp.troops));
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
      const risk = 1 - holdProbability(p, planet, planet.troops);
      gross += SHIELD_DEFENSE * 0.35 + risk * planetValue(planet) * 0.6;
      break;
    }
    case 'SPACEPORT': {
      gross += p.planets.length >= 2 ? (level === 1 ? 4 : 2.5) : 0.5;
      if (!hasB(p, 'SPACEPORT') && p.planets.length >= 2) {
        const silos = owned(p).filter((pl) => pl.buildings.SILO);
        if (silos.length > 0) {
          const staged = silos.reduce((x, pl) => Math.max(x, pl.troops), 0);
          gross += Math.min(6, (totalTroops(p) - staged) * 0.4);
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
