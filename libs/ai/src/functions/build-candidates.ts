import { getAiState } from '../state';
import { BUILD_ORDER, buildingCost } from '@seven-planets/game';
import type { BuildingType, Cost, Planet, Player } from '@seven-planets/game';

import { affordEta } from './afford-eta';
import { buildingWorth } from './building-worth';
import { cardAppearProb } from './card-appear-prob';
import { nextLevelAllowed } from './next-level-allowed';
import { owned } from './owned';

export interface BuildCandidate {
  id: BuildingType;
  planet: Planet;
  level: number;
  cost: Cost;
  worth: number;
  pComplete: number;
}

export function buildCandidates(player: Player): BuildCandidate[] {
  const aiState = getAiState();
  const all: BuildCandidate[] = [];
  for (const planet of owned(player)) {
    for (const id of BUILD_ORDER) {
      const level = nextLevelAllowed(player, planet, id);
      if (!level) {
        continue;
      }
      const cost = buildingCost(id, level);
      const worth = buildingWorth(player, id, planet, level);
      if (worth <= 0) {
        continue;
      }
      const eta = affordEta(player, cost);
      const pComplete =
        cardAppearProb(id, aiState.W.planHorizon) *
        Math.max(0.1, Math.min(1, 1.2 - eta / aiState.W.planHorizon));
      all.push({ id, planet, level, cost, worth, pComplete });
    }
  }
  all.sort(
    (buildCandidate, eachBuildCandidate) =>
      eachBuildCandidate.worth * eachBuildCandidate.pComplete -
      buildCandidate.worth * buildCandidate.pComplete,
  );
  const queue: BuildCandidate[] = [];
  for (const buildCandidate of all) {
    if (
      !queue.some((buildCandidate) => buildCandidate.id === buildCandidate.id)
    ) {
      queue.push(buildCandidate);
    }
    if (queue.length >= 5) {
      break;
    }
  }
  return queue;
}
