import { getAiState } from '../state';
import { BUILD_ORDER, computeBuildingCost } from '@seven-planets/game';
import type { BuildingType, Cost, Planet, Player } from '@seven-planets/game';

import { computeTurnsToAfford } from './compute-turns-to-afford';
import { computeBuildingWorth } from './compute-building-worth';
import { computeCardAppearProbability } from './compute-card-appear-probability';
import { getNextAllowedLevel } from './get-next-allowed-level';
import { getOwnedPlanets } from './get-owned-planets';

export interface BuildCandidate {
  id: BuildingType;
  planet: Planet;
  level: number;
  cost: Cost;
  worth: number;
  pComplete: number;
}

export function getBuildCandidates(player: Player): BuildCandidate[] {
  const aiState = getAiState();
  const candidates: BuildCandidate[] = [];
  for (const planet of getOwnedPlanets(player)) {
    for (const buildingType of BUILD_ORDER) {
      const level = getNextAllowedLevel(player, planet, buildingType);
      if (!level) {
        continue;
      }
      const cost = computeBuildingCost(buildingType, level);
      const worth = computeBuildingWorth(player, buildingType, planet, level);
      if (worth <= 0) {
        continue;
      }
      const turnsToAfford = computeTurnsToAfford(player, cost);
      const pComplete =
        computeCardAppearProbability(buildingType, aiState.W.planHorizon) *
        Math.max(0.1, Math.min(1, 1.2 - turnsToAfford / aiState.W.planHorizon));
      candidates.push({
        id: buildingType,
        planet,
        level,
        cost,
        worth,
        pComplete,
      });
    }
  }
  candidates.sort(
    (candidate, otherCandidate) =>
      otherCandidate.worth * otherCandidate.pComplete -
      candidate.worth * candidate.pComplete,
  );
  const queue: BuildCandidate[] = [];
  for (const candidate of candidates) {
    if (!queue.some((queued) => queued.id === candidate.id)) {
      queue.push(candidate);
    }
    if (queue.length >= 5) {
      break;
    }
  }
  return queue;
}
