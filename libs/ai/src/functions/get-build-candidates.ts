import type { BuildingType, Cost, Planet, Player } from '@seven-planets/game';
import { BUILD_ORDER, computeBuildingCost } from '@seven-planets/game';

import { getAiState } from '../state';
import { computeBuildingWorth } from './compute-building-worth';
import { computeCardAppearProbability } from './compute-card-appear-probability';
import { computeTurnsToAfford } from './compute-turns-to-afford';
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

export const getBuildCandidates = (player: Player): BuildCandidate[] => {
  const candidates: BuildCandidate[] = [];
  for (const planet of getOwnedPlanets(player)) {
    for (const buildingType of BUILD_ORDER) {
      const candidate = createBuildCandidate(player, planet, buildingType);
      if (candidate) {
        candidates.push(candidate);
      }
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
};

const createBuildCandidate = (
  player: Player,
  planet: Planet,
  buildingType: BuildingType,
): BuildCandidate | null => {
  const aiState = getAiState();
  const level = getNextAllowedLevel(player, planet, buildingType);
  if (!level) {
    return null;
  }
  const cost = computeBuildingCost(buildingType, level);
  const worth = computeBuildingWorth(player, buildingType, planet, level);
  if (worth <= 0) {
    return null;
  }
  const turnsToAfford = computeTurnsToAfford(player, cost);
  const pComplete =
    computeCardAppearProbability(buildingType, aiState.W.planHorizon) *
    Math.max(0.1, Math.min(1, 1.2 - turnsToAfford / aiState.W.planHorizon));
  return { id: buildingType, planet, level, cost, worth, pComplete };
};
